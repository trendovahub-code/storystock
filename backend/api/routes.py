from flask import Blueprint, jsonify, request, Response
import time
import re
from datetime import datetime
from engines.merger import DataMerger
from services.company_registry import CompanyRegistry
from services.analysis_include import parse_include_param
from services.analysis_service import AnalysisService
from services.contact_service import append_contact_submission
from services.pdf_report import PDFReportBuilder
from services.cache_service import cached_stock_data
from services.cache_service import CacheService, schedule_analysis_refresh
from utils.monitoring import record_request, snapshot_metrics
from services.usage_analytics import usage_summary
from services.user_rate_limiter import check_rate_limit
from services.feature_flags import is_enabled
import os

api_bp = Blueprint('api', __name__)
merger = DataMerger()
analysis_service = AnalysisService()
company_registry = CompanyRegistry()
BRAND_NAME = os.getenv("BRAND_NAME", "Trendova Hub")
APP_NAME = os.getenv("APP_NAME", f"{BRAND_NAME} Stock Analysis API")
EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def brand_error(message: str, detail: str | None = None):
    payload = {"error": message}
    if detail and os.getenv("DEBUG_ERRORS", "false").lower() in ("1", "true", "yes"):
        payload["detail"] = detail
    return jsonify(payload)

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": BRAND_NAME,
        "name": APP_NAME,
        "companies_loaded": company_registry.count,
    }), 200

@api_bp.route('/info', methods=['GET'])
def info():
    return jsonify({
        "service": BRAND_NAME,
        "name": APP_NAME,
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "url": os.getenv("APP_URL", "https://trendovahub.com")
    }), 200

@api_bp.route('/contact', methods=['POST'])
def submit_contact():
    client_id = request.headers.get("X-Client-Id") or request.remote_addr or "unknown"
    limit = int(os.getenv("USER_RATE_LIMIT_CONTACT_PER_MINUTE", "10"))
    if is_enabled("FEATURE_USER_RATE_LIMIT") and not check_rate_limit(f"contact:{client_id}", limit, 60):
        return brand_error(f"{BRAND_NAME} is experiencing high traffic. Please try again shortly."), 429

    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip()
    message = str(payload.get("message", "")).strip()

    if not name or not email or not message:
        return jsonify({"error": "Name, email, and message are required."}), 400
    if len(name) > 120:
        return jsonify({"error": "Name must be at most 120 characters."}), 400
    if len(email) > 200:
        return jsonify({"error": "Email must be at most 200 characters."}), 400
    if len(message) > 5000:
        return jsonify({"error": "Message must be at most 5000 characters."}), 400
    if not EMAIL_REGEX.match(email):
        return jsonify({"error": "Please enter a valid email address."}), 400

    forwarded_for = request.headers.get("X-Forwarded-For", "")
    ip = forwarded_for.split(",")[0].strip() if forwarded_for else request.remote_addr
    ok, detail = append_contact_submission(
        name=name,
        email=email,
        message=message,
        source="website-contact-form",
        ip=ip,
        user_agent=request.headers.get("User-Agent"),
    )
    if not ok:
        return brand_error("Unable to submit your message at the moment. Please try again later.", detail), 502

    return jsonify({"message": "Thanks for contacting us. Your message has been submitted."}), 200

@api_bp.route('/contact/test', methods=['GET'])
def test_contact_webhook():
    """
    One-click connectivity test for the contact webhook.
    If ADMIN_TOKEN is configured, pass it via X-Admin-Token header or ?token= query param.
    """
    admin_token = os.getenv("ADMIN_TOKEN", "").strip()
    if admin_token:
        supplied = (request.headers.get("X-Admin-Token") or request.args.get("token") or "").strip()
        if supplied != admin_token:
            return brand_error("Unauthorized"), 401

    ok, detail = append_contact_submission(
        name="Webhook Connectivity Test",
        email="noreply@trendovahub.com",
        message=f"Backend connectivity test at {datetime.utcnow().isoformat()}Z",
        source="webhook-connectivity-test",
        ip=request.remote_addr,
        user_agent=request.headers.get("User-Agent"),
    )
    if not ok:
        return brand_error("Contact webhook test failed.", detail), 502

    return jsonify({
        "message": "Contact webhook is reachable and accepted the test payload.",
        "status": "ok",
    }), 200

@api_bp.route('/analysis/<symbol>', methods=['GET'])
@cached_stock_data(timeout=3600)
def get_analysis(symbol):
    try:
        client_id = request.headers.get("X-Client-Id") or request.remote_addr or "unknown"
        limit = int(os.getenv("USER_RATE_LIMIT_ANALYSIS_PER_MINUTE", "30"))
        if is_enabled("FEATURE_USER_RATE_LIMIT") and not check_rate_limit(f"analysis:{client_id}", limit, 60):
            return brand_error(f"{BRAND_NAME} is experiencing high traffic. Please try again shortly."), 429
        include_param = request.args.get("include", "").strip().lower()
        include_set = parse_include_param(include_param)
        insights_param = request.args.get("insights", "true").strip().lower()
        include_ai = insights_param not in ("0", "false", "no")

        # 1. Fetch data from screener.in
        data_context = merger.merge_stock_data(symbol, include_set)

        # 2. Run Analysis Engines
        full_report = analysis_service.perform_full_analysis(data_context, include_ai=include_ai)
        return full_report, 200
    except Exception as e:
        return brand_error(f"{BRAND_NAME} encountered an error.", str(e)), 500

@api_bp.route('/report/<symbol>', methods=['GET'])
def get_report(symbol):
    start = time.time()
    status = 500
    try:
        client_id = request.headers.get("X-Client-Id") or request.remote_addr or "unknown"
        limit = int(os.getenv("USER_RATE_LIMIT_REPORT_PER_MINUTE", "10"))
        if is_enabled("FEATURE_USER_RATE_LIMIT") and not check_rate_limit(f"report:{client_id}", limit, 60):
            return brand_error(f"{BRAND_NAME} is experiencing high traffic. Please try again shortly."), 429

        insights_param = request.args.get("insights", "true").strip().lower()
        include_ai = insights_param not in ("0", "false", "no")

        data_context = merger.merge_stock_data(symbol, {"financials", "price"})
        full_report = analysis_service.perform_full_analysis(data_context, include_ai=include_ai)

        pdf_bytes = PDFReportBuilder(full_report).build()

        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"{symbol.upper()}_Analysis_{date_str}.pdf"

        status = 200
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
        )
    except Exception as e:
        return brand_error(f"{BRAND_NAME} encountered an error.", str(e)), 500
    finally:
        duration_ms = (time.time() - start) * 1000
        record_request("report", status, duration_ms)

@api_bp.route('/search', methods=['GET'])
def search_stocks():
    """
    Search for companies using the hardcoded CSV registry (5,281 companies).
    Returns matching stocks with near-zero latency (in-memory search).
    """
    client_id = request.headers.get("X-Client-Id") or request.remote_addr or "unknown"
    limit = int(os.getenv("USER_RATE_LIMIT_SEARCH_PER_MINUTE", "120"))
    if is_enabled("FEATURE_USER_RATE_LIMIT") and not check_rate_limit(f"search:{client_id}", limit, 60):
        return brand_error(f"{BRAND_NAME} is experiencing high traffic. Please try again shortly."), 429

    query = request.args.get('q', '').strip()
    if not query or len(query) < 1:
        return jsonify({"results": []}), 200

    start = time.time()
    status = 200
    try:
        results = company_registry.search(query, limit=10)

        # Format results for frontend compatibility
        formatted = []
        for r in results:
            formatted.append({
                "symbol": r["symbol"],
                "name": r["name"],
                "exchange": r["exchange"],
                "sector": r["exchange"],  # Frontend expects sector; show exchange
                "source": "registry",
            })

        elapsed = time.time() - start
        return jsonify({
            "query": query,
            "results": formatted,
            "count": len(formatted),
            "latency_ms": round(elapsed * 1000, 2),
        }), 200

    except Exception as e:
        import traceback
        print(f"Search error: {e}")
        traceback.print_exc()
        status = 500
        return jsonify({
            "query": query,
            "results": [],
            "error": f"{BRAND_NAME} encountered an error.",
            "fallback": True
        }), 200
    finally:
        duration_ms = (time.time() - start) * 1000
        record_request("search", status, duration_ms)

@api_bp.route('/admin/clear-cache', methods=['POST'])
def clear_cache():
    """
    Clears all cached analysis data.
    """
    from services.cache_service import CacheService
    cache = CacheService()
    if cache.enabled:
        cache.client.flushdb()
        return jsonify({"message": "Cache cleared successfully"}), 200
    return jsonify({"error": "Cache service not available"}), 500

@api_bp.route('/admin/metrics', methods=['GET'])
def metrics():
    cache_stats = CacheService().get_stats()
    return jsonify({
        "metrics": snapshot_metrics(),
        "cache": cache_stats,
        "usage": usage_summary(),
        "companies_loaded": company_registry.count,
        "timestamp": time.time()
    }), 200

@api_bp.route('/admin/usage', methods=['GET'])
def usage():
    window = int(request.args.get("window", "86400"))
    top_n = int(request.args.get("top", "10"))
    return jsonify(usage_summary(window_seconds=window, top_n=top_n)), 200

@api_bp.route('/history/<symbol>', methods=['GET'])
def get_history(symbol):
    start = time.time()
    status = 500
    try:
        client_id = request.headers.get("X-Client-Id") or request.remote_addr or "unknown"
        limit = int(os.getenv("USER_RATE_LIMIT_HISTORY_PER_MINUTE", "60"))
        if is_enabled("FEATURE_USER_RATE_LIMIT") and not check_rate_limit(f"history:{client_id}", limit, 60):
            return brand_error(f"{BRAND_NAME} is experiencing high traffic. Please try again shortly."), 429
        data_context = merger.merge_stock_data(symbol, {"history", "price"})
        status = 200
        return jsonify({
            "symbol": symbol.upper(),
            "price": data_context.get("price", {})
        }), 200
    except Exception as e:
        return brand_error(f"{BRAND_NAME} encountered an error.", str(e)), 500
    finally:
        duration_ms = (time.time() - start) * 1000
        record_request("history", status, duration_ms)

@api_bp.route('/insights/<symbol>', methods=['GET'])
def get_insights(symbol):
    start = time.time()
    status = 500
    try:
        client_id = request.headers.get("X-Client-Id") or request.remote_addr or "unknown"
        limit = int(os.getenv("USER_RATE_LIMIT_INSIGHTS_PER_MINUTE", "30"))
        if is_enabled("FEATURE_USER_RATE_LIMIT") and not check_rate_limit(f"insights:{client_id}", limit, 60):
            return brand_error(f"{BRAND_NAME} is experiencing high traffic. Please try again shortly."), 429
        include_param = request.args.get("include", "financials").strip().lower()
        include_set = parse_include_param(include_param)

        cache = CacheService()
        cache_key = f"stock_analysis:{symbol.upper()}:{include_param}:3600"
        cached_val, _cached_at, _ttl = cache.get_with_metadata(cache_key)

        if cached_val:
            analysis_context = {
                "symbol": cached_val.get("symbol"),
                "profile": cached_val.get("profile"),
                "ratios": cached_val.get("ratios"),
                "stance": cached_val.get("stance"),
                "benchmarks": cached_val.get("benchmarks"),
            }
        else:
            data_context = merger.merge_stock_data(symbol, include_set)
            ratios = analysis_service.ratio_engine.compute_ratios(data_context)
            stance_result = analysis_service.stance_engine.determine_stance(ratios)
            sector = data_context.get("profile", {}).get("sector", "Default")
            benchmarks = analysis_service.benchmarking_engine.get_benchmark_comparison(sector, ratios)
            analysis_context = {
                "symbol": data_context.get("symbol"),
                "profile": data_context.get("profile"),
                "ratios": ratios,
                "stance": stance_result,
                "benchmarks": benchmarks
            }

        ai_insights = analysis_service.generate_ai_insights(analysis_context)
        status = 200
        return jsonify({"symbol": symbol.upper(), "ai_insights": ai_insights}), 200
    except Exception as e:
        return brand_error(f"{BRAND_NAME} encountered an error.", str(e)), 500
    finally:
        duration_ms = (time.time() - start) * 1000
        record_request("insights", status, duration_ms)

@api_bp.route('/admin/prefetch', methods=['POST'])
def prefetch():
    payload = request.get_json(silent=True) or {}
    symbols = payload.get("symbols", [])
    include_param = str(payload.get("include", "basic")).strip().lower()
    timeout = int(payload.get("timeout", 3600))
    if not isinstance(symbols, list) or not symbols:
        return jsonify({"error": "symbols must be a non-empty list"}), 400

    scheduled = 0
    for symbol in symbols:
        symbol = str(symbol).upper().strip()
        if not symbol:
            continue
        if schedule_analysis_refresh(symbol, include_param, timeout, delay_seconds=2.0, priority=3):
            scheduled += 1

    return jsonify({
        "scheduled": scheduled,
        "total": len(symbols),
        "include": include_param,
        "timeout": timeout
    }), 200
