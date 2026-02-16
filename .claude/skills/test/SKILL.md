---
name: test
description: Run tests or write new tests for the Asset Analysis project. Supports running existing tests, writing new test cases, and checking coverage.
argument-hint: "[test-file-or-area]"
disable-model-invocation: true
---

# Test Skill

Run or write tests for: `$ARGUMENTS`

## Test Location

All tests live in `backend/tests/`:
- `test_advanced_ratios.py` - Financial ratio computation tests
- `test_backend_data.py` - Backend data integration tests
- `__init__.py` - Package init

## Running Tests

```bash
cd backend
source venv/bin/activate
python -m pytest tests/ -v
```

Run a specific test:
```bash
python -m pytest tests/test_advanced_ratios.py -v
python -m pytest tests/test_backend_data.py -v
```

## Writing New Tests

Follow the existing pattern using `unittest.mock`:

```python
import unittest
from unittest.mock import patch, MagicMock

class TestFeatureName(unittest.TestCase):
    """Tests for <feature description>."""

    def setUp(self):
        """Set up test fixtures."""
        self.sample_data = {
            # Use realistic stock data matching screener.in format
        }

    @patch('backend.engines.merger.DataMerger')
    def test_something(self, mock_merger):
        """Test description."""
        mock_merger.return_value.fetch_data.return_value = self.sample_data
        # ... test logic
        self.assertEqual(result, expected)

    def test_edge_case(self):
        """Test with missing/zero data."""
        # Always test division by zero for ratio calculations
        # Always test missing keys in scraped data
        pass
```

## What to Test

### Ratio Engine (`backend/engines/ratio_engine.py`)
- ROE, ROA, Net Margin calculations
- Piotroski F-Score (0-9 range)
- Altman Z-Score
- Edge cases: zero equity, missing values, negative margins

### Stance Engine (`backend/engines/stance_engine.py`)
- Pillar score calculations
- Overall stance determination
- Red flag detection

### Benchmarking Engine (`backend/engines/benchmarking_engine.py`)
- Sector average computation
- Status determination (above/inline/below)

### Data Merger (`backend/engines/merger.py`)
- Provider data merging
- Missing field handling
- Cache interaction

### Services
- Cache hit/miss scenarios
- Rate limiter edge cases
- Company search accuracy

## Dev Dependencies

Test tools are in `backend/requirements-dev.txt`:
- pytest
- black (formatting)
- flake8 (linting)
- mypy (type checking)

## Steps

1. If running tests: Execute pytest with verbose output
2. If writing tests: Read the source file being tested first
3. Follow existing test patterns with unittest.mock
4. Ensure edge cases are covered (zero division, missing data, None values)
5. Run the full test suite to verify nothing is broken
