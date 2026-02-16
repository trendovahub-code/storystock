---
name: debug
description: Debug issues in the Asset Analysis project. Provides project-specific debugging context, common error patterns, and file locations to investigate.
argument-hint: "<error-description>"
---

# Debug Skill

Debug the issue: `$ARGUMENTS`

## Project Architecture (Quick Reference)

```
Request Flow:
  Frontend (Next.js :3000)
    → axios GET/POST
    → Backend Flask API (:5002)
      → Route handler (backend/api/routes.py)
      → Cache check (backend/services/cache_service.py)
      → DataMerger (backend/engines/merger.py)
        → ScreenerProvider (backend/providers/screener_provider.py)
          → HTTP scrape screener.in
      → RatioEngine → StanceEngine → BenchmarkingEngine
      → LLMOrchestrator (Groq API)
      → Response JSON
```

## Common Error Patterns & Where to Look

### "CORS error" / "Network Error"
- Check: `backend/app.py` (Flask-CORS setup)
- Check: Frontend API base URL in component (should be `http://localhost:5002`)
- Fix: Ensure backend is running on port 5002

### "Rate limit exceeded"
- Check: `backend/services/user_rate_limiter.py`
- Check: Rate limit config in `backend/api/routes.py` per endpoint
- Fix: Adjust `max_requests` or `window_seconds`

### "Scraping failed" / Empty data
- Check: `backend/providers/screener_provider.py` (scraper logic)
- Check: `backend/utils/api_resilience.py` (circuit breaker state)
- Check: `backend/services/http_client.py` (HTTP timeouts)
- Common: screener.in may have changed HTML structure

### "Groq API error" / LLM failures
- Check: `backend/llm/orchestrator.py` (API calls)
- Check: `.env` for `GROQ_API_KEY`
- Check: `backend/llm/prompts.py` (prompt format)
- Note: LLM failures are non-fatal; analysis returns without AI insights

### "Cache miss" / Stale data
- Check: `backend/services/cache_service.py` (3-layer cache)
- Check: Redis connection (`redis-cli ping`)
- Check: `backend/services/persistent_cache.py` (SQLite fallback)
- Memory cache: 300s TTL, 1000 entries max
- Redis cache: 3600s default TTL

### "Company not found" / Search issues
- Check: `backend/services/company_registry.py` (CSV-based lookup)
- Check: Data file loaded by company_registry
- Verify: Symbol format (e.g., "RELIANCE" not "RELIANCE.NS")

### Frontend rendering issues
- Check: `frontend/src/app/analysis/[symbol]/AnalysisClient.tsx` (main analysis UI)
- Check: Component props and TypeScript types
- Check: API response shape matches frontend expectations

### Build/Compilation errors
- Backend: Check `backend/requirements.txt` for missing deps
- Frontend: Check `frontend/package.json`, run `npm install`
- TypeScript: Check `frontend/tsconfig.json`

## Debugging Steps

1. **Identify the layer**: Is it frontend, API, scraping, caching, or LLM?
2. **Check logs**: Backend Flask logs show request/response details
3. **Test the API directly**: `curl http://localhost:5002/api/health`
4. **Check services**: Redis (`redis-cli ping`), Backend (`/api/health`), Frontend (`:3000`)
5. **Read the relevant source file** listed above
6. **Check recent changes**: `git diff` for recent modifications

## Key Files for Debugging

| Area | File |
|------|------|
| API Routes | `backend/api/routes.py` |
| App Setup | `backend/app.py` |
| Data Fetching | `backend/engines/merger.py` |
| Scraping | `backend/providers/screener_provider.py` |
| Caching | `backend/services/cache_service.py` |
| LLM | `backend/llm/orchestrator.py` |
| Rate Limits | `backend/services/user_rate_limiter.py` |
| Frontend UI | `frontend/src/app/analysis/[symbol]/AnalysisClient.tsx` |
| Config | `backend/.env` |
