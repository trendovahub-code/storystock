---
name: add-provider
description: Add a new data provider to the backend for fetching stock data from external sources. Follows the base provider pattern with resilience and caching.
argument-hint: "<provider-name> <data-source-url>"
disable-model-invocation: true
---

# Add Data Provider Skill

Create a new data provider: `$ARGUMENTS`

## Provider Architecture

Providers live in `backend/providers/` and extend the base class in `backend/providers/base.py`.

## Current Active Provider

Only `screener_provider.py` is used in production. It's called by `backend/engines/merger.py` (the DataMerger).

## File to Create

`backend/providers/<name>_provider.py`

## Steps

1. Read `backend/providers/base.py` to understand the base class interface
2. Read `backend/providers/screener_provider.py` as the reference implementation
3. Create the new provider following the same pattern:
   - Extend the base provider class
   - Implement required methods (fetch data, parse response, map fields)
   - Add error handling and timeouts
   - Use `backend/services/http_client.py` for HTTP requests
   - Use `backend/utils/api_resilience.py` for circuit breaker/retry patterns
4. Register the provider in `backend/engines/merger.py` if it should be a data source
5. Add any new API keys to `.env` and document them
6. Write tests in `backend/tests/`

## Data Format Convention

Providers must return data matching the field format expected by the engines:
- Financial metrics (revenue, profit, margins, ratios)
- Company info (name, sector, industry)
- Price data (current price, market cap, 52-week range)

Check `backend/engines/ratio_engine.py` for the exact field names expected.

## Resilience Requirements

- HTTP timeout: 10-30 seconds
- Retry logic with exponential backoff
- Circuit breaker to prevent cascading failures
- Graceful degradation (return partial data if possible)
- Rate limiting to respect external API limits
