# Asset Analysis - Trendova Hub

## Project Overview
Stock analysis platform for Indian NSE stocks with AI-powered insights.

## Tech Stack
- **Backend**: Flask (Python) on port 5002
- **Frontend**: Next.js 16 + React 19 + Tailwind v4 on port 3000
- **LLM**: Groq (Llama 3.3 70B) for multi-perspective analysis
- **Cache**: 3-layer (Memory → Redis → SQLite disk)
- **Data**: screener.in web scraping via ScreenerProvider

## Key Directories
```
backend/
  api/routes.py          - All API endpoints (Flask Blueprint)
  app.py                 - Flask app factory & startup
  engines/               - Computation (merger, ratio, stance, benchmarking)
  providers/             - Data sources (only screener_provider.py is active)
  services/              - Business logic (cache, analysis, rate limiting, etc.)
  llm/                   - Groq orchestrator + prompts
  models/                - Data integrity validation
  utils/                 - DNS fix, monitoring, API resilience
  tests/                 - Unit tests (pytest + unittest.mock)
frontend/
  src/app/               - Next.js App Router pages
  src/components/        - React components (+ ui/ for Radix primitives)
  src/lib/utils.ts       - Utility functions
```

## Commands
- **Backend**: `cd backend && source venv/bin/activate && PORT=5002 python app.py`
- **Frontend**: `cd frontend && npm run dev`
- **Tests**: `cd backend && python -m pytest tests/ -v`
- **Lint**: `cd backend && flake8 . --exclude=venv,__pycache__`
- **Build**: `cd frontend && npm run build`

## Architecture Flow
```
ScreenerProvider → DataMerger → AnalysisService → API Routes
                                    ↓
                  RatioEngine + StanceEngine + BenchmarkingEngine
                                    ↓
                            LLMOrchestrator (Groq)
```

## Conventions
- Routes use rate limiting via `user_rate_limiter` and feature flags via `feature_flags`
- Cache keys: `analysis:{symbol}`, `search:{query}`
- Error responses: `{"error": "message"}` with appropriate HTTP status
- Frontend uses Tailwind dark theme (bg-gray-900, text-white, border-gray-800)
- Components use TypeScript interfaces for props
- Services use module-level singleton pattern
