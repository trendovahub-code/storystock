---
name: add-endpoint
description: Add a new API endpoint to the Flask backend following existing patterns, conventions, rate limiting, and caching. Use when adding new API routes.
argument-hint: "<endpoint-path> <description>"
disable-model-invocation: true
---

# Add API Endpoint Skill

Add a new API endpoint: `$ARGUMENTS`

## Where to Add

All routes go in **`backend/api/routes.py`** under the `api` Blueprint.

## Existing Endpoint Pattern

Follow this exact pattern from the existing codebase:

```python
@api.route('/api/<endpoint>', methods=['GET'])
def endpoint_name(symbol=None):
    """Description of what this endpoint does."""
    try:
        # 1. Rate limiting (pick appropriate tier)
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if feature_flags.is_enabled('user_rate_limit'):
            allowed, info = user_rate_limiter.check_rate_limit(
                client_ip, 'endpoint_name',
                max_requests=30,  # adjust per endpoint
                window_seconds=60
            )
            if not allowed:
                return jsonify({"error": "Rate limit exceeded", **info}), 429

        # 2. Input validation
        # Validate parameters here

        # 3. Cache check (if applicable)
        cache_key = f"prefix:{param}"
        cached = cache_service.get(cache_key)
        if cached:
            return jsonify(cached)

        # 4. Business logic
        result = some_service.do_work(param)

        # 5. Cache store (if applicable)
        cache_service.set(cache_key, result, ttl=3600)

        # 6. Analytics tracking
        if feature_flags.is_enabled('usage_analytics'):
            usage_analytics.track_request(request, 'endpoint_name')

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

## Rate Limit Tiers (from existing code)

| Tier | Requests/min | Use For |
|------|-------------|---------|
| Heavy | 30 | Analysis, insights (expensive operations) |
| Medium | 60 | History, data fetches |
| Light | 120 | Search, lookups |
| Admin | 10 | Reports, cache management |

## Available Services (import from `backend/services/`)

- `analysis_service` - Stock analysis orchestration
- `cache_service` - Multi-layer caching (get/set/delete)
- `company_registry` - Company search (5,281 NSE companies)
- `usage_analytics` - Request tracking
- `user_rate_limiter` - Rate limiting
- `feature_flags` - Feature toggles
- `pdf_report` - PDF generation
- `health_monitor` - System health

## Available Engines (import from `backend/engines/`)

- `merger.DataMerger` - Fetches & merges data from providers
- `ratio_engine.RatioEngine` - Financial ratio calculations
- `stance_engine.StanceEngine` - Investment stance scoring
- `benchmarking_engine.BenchmarkingEngine` - Sector comparisons

## Steps

1. Read `backend/api/routes.py` to see current endpoints
2. Add the new route following the pattern above
3. Create or update any needed service in `backend/services/`
4. Add appropriate rate limiting and caching
5. Test the endpoint manually with curl or the frontend
