---
name: add-service
description: Add a new backend service to the Asset Analysis project following existing singleton patterns, proper initialization, and integration with the Flask app.
argument-hint: "<service-name> <description>"
disable-model-invocation: true
---

# Add Service Skill

Create a new service: `$ARGUMENTS`

## Service Location

All services live in `backend/services/<service_name>.py`

## Existing Service Pattern

Services in this project use a module-level singleton pattern:

```python
"""
Service description.
"""

import os
import logging

logger = logging.getLogger(__name__)


class ServiceName:
    """Description of what this service does."""

    def __init__(self):
        """Initialize with config from environment."""
        self.config_value = os.getenv('CONFIG_KEY', 'default')
        self._internal_state = {}
        logger.info(f"ServiceName initialized")

    def do_something(self, param):
        """Public method description."""
        try:
            result = self._internal_logic(param)
            return result
        except Exception as e:
            logger.error(f"ServiceName error: {e}")
            return None

    def _internal_logic(self, param):
        """Private helper method."""
        pass


# Module-level singleton instance
service_name = ServiceName()
```

## Integration Points

### 1. Import in Routes (`backend/api/routes.py`)
```python
from services.service_name import service_name
```

### 2. Feature Flag Guard (if toggleable)
```python
if feature_flags.is_enabled('service_name'):
    result = service_name.do_something(param)
```

### 3. Background Job (if periodic)
Register in `backend/services/background_jobs.py`:
```python
from services.service_name import service_name
# Add to job scheduler
```

### 4. App Startup (if needs initialization)
Add to `backend/app.py` if the service needs early setup.

## Existing Services Reference

| Service | Purpose | Feature Flag |
|---------|---------|-------------|
| `analysis_service` | Orchestrates stock analysis | - |
| `cache_service` | Multi-layer caching | - |
| `company_registry` | Company search (CSV) | - |
| `user_rate_limiter` | Per-IP rate limiting | `user_rate_limit` |
| `usage_analytics` | Request tracking | `usage_analytics` |
| `feature_flags` | Feature toggles | - |
| `pdf_report` | PDF generation | - |
| `health_monitor` | System health | - |
| `background_jobs` | Periodic tasks | - |
| `request_scheduler` | Task scheduling | - |
| `persistent_cache` | SQLite disk cache | - |
| `http_client` | Resilient HTTP | - |
| `alerting` | Alert system | - |
| `maintenance` | Maintenance tasks | - |

## Steps

1. Create `backend/services/<name>.py` following the pattern above
2. Add environment variables to `.env` if needed
3. Import and use in `backend/api/routes.py`
4. Add feature flag in `backend/services/feature_flags.py` if toggleable
5. Write tests in `backend/tests/`
6. Add to background jobs if it needs periodic execution
