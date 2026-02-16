---
name: refactor
description: Refactor code in the Asset Analysis project following existing patterns and conventions. Ensures no breaking changes and maintains test compatibility.
argument-hint: "<file-or-area> <goal>"
disable-model-invocation: true
---

# Refactor Skill

Refactor: `$ARGUMENTS`

## Pre-Refactor Checklist

1. **Read the target file(s)** completely before making changes
2. **Identify all importers**: Use Grep to find every file that imports from the target
3. **Run existing tests** to establish a baseline: `cd backend && python -m pytest tests/ -v`
4. **Check git status** to understand current changes

## Project Conventions

### Backend (Python)
- **Framework**: Flask with Blueprint pattern
- **Imports**: Relative imports within packages, absolute from project root
- **Services**: Singleton pattern, imported directly in routes
- **Error handling**: try/except with JSON error responses
- **Config**: Environment variables via `python-dotenv`
- **Formatting**: Follow black/flake8 (see `requirements-dev.txt`)

### Frontend (TypeScript/React)
- **Framework**: Next.js App Router
- **Components**: Functional components with TypeScript interfaces
- **Styling**: Tailwind CSS v4 utility classes only
- **State**: React hooks, Zustand for global state
- **Imports**: `@/` alias maps to `frontend/src/`

## Key Architecture Boundaries

```
providers/ → engines/ → services/ → api/routes.py
                                        ↓
                              Frontend pages/components
```

- **Providers** only fetch raw data (no business logic)
- **Engines** compute metrics (pure functions where possible)
- **Services** orchestrate workflow and manage state
- **Routes** handle HTTP concerns (request/response, rate limits, caching)

## Common Refactoring Patterns

### Extract a Service
1. Create `backend/services/<name>.py`
2. Move logic from route handler into service
3. Import service in `backend/api/routes.py`
4. Keep route handler thin (validation, caching, response formatting)

### Extract a Component
1. Create `frontend/src/components/<Name>.tsx`
2. Define TypeScript interface for props
3. Move JSX and related state into component
4. Import in parent page/component

### Rename/Move
1. Update all import statements (use Grep to find all references)
2. Update any string references (cache keys, feature flag names)
3. Run tests to verify nothing broke

## Post-Refactor Checklist

1. Run tests: `cd backend && python -m pytest tests/ -v`
2. Verify no circular imports
3. Check that all endpoints still respond: `curl http://localhost:5002/api/health`
4. Review changes with `git diff`
