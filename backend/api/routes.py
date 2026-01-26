from flask import Blueprint, jsonify, request
from engines.merger import DataMerger
from services.analysis_service import AnalysisService
from services.cache_service import cached_stock_data
import os

api_bp = Blueprint('api', __name__)
merger = DataMerger()
analysis_service = AnalysisService()

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "backend"}), 200

@api_bp.route('/analysis/<symbol>', methods=['GET'])
@cached_stock_data(timeout=3600)
def get_analysis(symbol):
    try:
        # 1. Fetch and Merge Raw Data
        data_context = merger.merge_stock_data(symbol)
        
        # 2. Run Analysis Engines
        full_report = analysis_service.perform_full_analysis(data_context)
        
        return full_report, 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/search', methods=['GET'])
def search_stocks():
    query = request.args.get('q', '').upper()
    if not query or len(query) < 2:
        return jsonify({"results": []}), 200
        
    try:
        import yfinance as yf
        # Search for tickers
        search = yf.Search(query, max_results=8)
        
        results = []
        for quote in search.quotes:
            symbol = quote.get("symbol", "")
            # Only include NSE stocks for this platform
            if symbol.endswith(".NS") or quote.get("exchange") == "NSI":
                clean_symbol = symbol.replace(".NS", "")
                results.append({
                    "symbol": clean_symbol,
                    "name": quote.get("longname") or quote.get("shortname") or symbol,
                    "sector": quote.get("sector", "NSE Stock")
                })
        
        return jsonify({
            "query": query,
            "results": results
        }), 200
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({"results": [], "error": str(e)}), 500

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
