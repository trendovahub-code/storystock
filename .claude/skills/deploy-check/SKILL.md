---
name: deploy-check
description: Run pre-deployment checks for the Asset Analysis project. Validates backend, frontend build, tests, environment config, and security.
disable-model-invocation: true
---

# Pre-Deployment Check Skill

Run a comprehensive pre-deployment validation.

## Checks to Perform

### 1. Environment Configuration
- Verify `.env` exists in `backend/` with required keys:
  - `GROQ_API_KEY` (must be set, not empty)
  - `PORT` (default 5002)
  - `REDIS_URL` (default redis://localhost:6379/0)
- No secrets in committed code (grep for API keys, passwords)
- No `localhost` URLs in production frontend code

### 2. Backend Validation
```bash
cd backend
source venv/bin/activate

# Dependencies
pip install -r requirements.txt --dry-run

# Tests
python -m pytest tests/ -v

# Linting (if configured)
flake8 . --max-line-length=120 --exclude=venv,__pycache__

# Import check - verify no broken imports
python -c "from api.routes import api; print('Routes OK')"
python -c "from engines.merger import DataMerger; print('Merger OK')"
python -c "from services.analysis_service import AnalysisService; print('Analysis OK')"
```

### 3. Frontend Validation
```bash
cd frontend

# Dependencies
npm install

# Type checking & build
npm run build

# Lint
npm run lint
```

### 4. Security Checks
- No hardcoded API keys in source files
- No `.env` files staged for commit
- Rate limiting enabled on all public endpoints
- CORS configured appropriately (not `*` in production)
- Input validation on route parameters

### 5. Data Integrity
- Verify `backend/models/data_integrity.py` rules are current
- Check scraper field mappings in `backend/providers/screener_provider.py`
- Ensure compliance filtering in `backend/llm/orchestrator.py`

### 6. Service Dependencies
- Redis connectivity
- Groq API accessibility
- screener.in reachability

## Output

Report results as:
- PASS: Check succeeded
- FAIL: Check failed (with details)
- WARN: Non-critical issue found

## Steps

1. Run all backend checks
2. Run all frontend checks
3. Run security scan
4. Report results summary
