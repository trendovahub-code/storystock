---
name: fix-issue
description: Fix a bug or issue in the Asset Analysis project. Provides structured debugging workflow with project-specific context to quickly identify and resolve problems.
argument-hint: "<issue-description>"
---

# Fix Issue Skill

Fix the issue: `$ARGUMENTS`

## Structured Debugging Workflow

### Step 1: Reproduce & Understand
- Identify which layer the issue is in (frontend, API, engine, provider, cache, LLM)
- Check recent git changes: `git diff` and `git log --oneline -10`
- Check if the issue is consistent or intermittent

### Step 2: Locate the Root Cause

**Use this file map to navigate quickly:**

| Symptom | First file to check |
|---------|-------------------|
| API returns error | `backend/api/routes.py` |
| Wrong calculations | `backend/engines/ratio_engine.py` |
| Missing/stale data | `backend/services/cache_service.py` |
| Scraping fails | `backend/providers/screener_provider.py` |
| AI insights wrong | `backend/llm/orchestrator.py` + `prompts.py` |
| Search broken | `backend/services/company_registry.py` |
| Frontend crash | `frontend/src/app/analysis/[symbol]/AnalysisClient.tsx` |
| Styling broken | `frontend/src/app/globals.css` |
| Component error | Check the specific component in `frontend/src/components/` |
| Rate limit issue | `backend/services/user_rate_limiter.py` |
| PDF export fails | `backend/services/pdf_report.py` |
| Feature flag issue | `backend/services/feature_flags.py` |
| DNS/Network | `backend/utils/dns_fix.py` + `api_resilience.py` |

### Step 3: Fix
- Make minimal, targeted changes
- Don't refactor surrounding code
- Preserve existing error handling patterns
- Add edge case handling if the bug was a missing check

### Step 4: Verify
- Run tests: `cd backend && python -m pytest tests/ -v`
- Test the specific endpoint if it's an API issue
- Check frontend renders correctly if it's a UI issue
- Verify cache behavior if it's a data issue

## Common Gotchas in This Project

1. **screener.in HTML changes**: The scraper uses CSS selectors that break when the site updates
2. **Division by zero**: Financial ratios (P/E, ROE, etc.) can have zero denominators
3. **Missing data keys**: Scraped data may not have all expected fields
4. **Redis disconnection**: Cache falls back to memory/disk but behavior changes
5. **Groq rate limits**: LLM calls may fail; analysis should still return without AI insights
6. **Symbol format**: Use plain symbols like "RELIANCE", not "RELIANCE.NS" or "RELIANCE.BSE"
7. **Feature flags**: Some features are toggled via environment variables
