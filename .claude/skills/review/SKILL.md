---
name: review
description: Review code changes for this project. Checks for security, performance, caching, and coding conventions. Use when reviewing a PR, staged changes, or specific files.
argument-hint: "[file-or-branch]"
---

# Code Review Skill

Review the code changes specified by `$ARGUMENTS`. If no argument is provided, review all staged/unstaged changes via `git diff`.

## Project Context

- **Backend**: Flask (Python) at `backend/`
- **Frontend**: Next.js 16 + React 19 + Tailwind v4 at `frontend/`
- **Data Source**: `screener_provider.py` scrapes screener.in
- **LLM**: Groq (Llama 3.3 70B) via `backend/llm/orchestrator.py`
- **Caching**: 3-layer (Memory -> Redis -> SQLite disk)
- **API Base**: `backend/api/routes.py` (all endpoints here)

## Review Checklist

### Security
- No hardcoded secrets or API keys (check for GROQ_API_KEY leaks)
- Input validation on all route parameters (especially `<symbol>` params)
- No raw HTML injection (BeautifulSoup scraping must sanitize)
- Rate limiting applied to new endpoints (`user_rate_limiter`)
- CORS settings not overly permissive

### Backend Patterns
- Routes follow pattern in `backend/api/routes.py` (blueprint-based)
- Services are imported and used via `backend/services/`
- Cache keys follow existing naming: `analysis:{symbol}`, `search:{query}`
- Error responses use consistent JSON format: `{"error": "message"}`
- Feature flags checked via `feature_flags.is_enabled()`
- Logging uses structured format

### Frontend Patterns
- Components use TypeScript with proper types
- Styling uses Tailwind CSS v4 utility classes (no custom CSS unless necessary)
- API calls use axios with base URL `http://localhost:5002`
- Pages follow Next.js App Router conventions (`page.tsx`, `layout.tsx`)
- UI components use Radix UI primitives from `frontend/src/components/ui/`
- State management via Zustand if needed

### Performance
- New data fetches go through cache layer (`cache_service`)
- Heavy computations should not block the request thread
- Frontend: no unnecessary re-renders, proper loading states with Skeleton components
- BeautifulSoup scraping includes timeout and error handling

### Data Integrity
- Financial calculations validated against rules in `backend/models/data_integrity.py`
- Ratio computations handle division-by-zero and missing data
- LLM responses pass compliance filtering (no investment advice language)

## Output Format

Provide findings organized by severity:
1. **Critical** - Security issues, data corruption risks
2. **Warning** - Performance issues, missing error handling
3. **Suggestion** - Style improvements, better patterns
4. **Good** - Positive patterns worth noting
