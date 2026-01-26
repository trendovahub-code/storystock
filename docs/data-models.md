# Data Models & API Contracts

## Core Data Models

### StockContext
The master object containing all fetched and normalized data for a stock.
- `symbol`: string (e.g., "RELIANCE")
- `profile`: Company description, sector, industry.
- `price_data`: Current price, high/low, volume.
- `financials`: Income statement, balance sheet, cashflow.
- `quality_score`: Data integrity score (0-100).

### ComputedMetrics
- `symbol`: string
- `metrics`: Dictionary of `MetricValue` objects (ROE, PE, Debt/Equity, etc.).
- `stance`: Overall fundamental stance (Strong, Mixed, etc.).

## API Endpoints

### 1. Search Stocks
`GET /api/search?q={query}`
**Response:**
```json
{
  "results": [
    { "symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT" }
  ]
}
```

### 2. Full Analysis
`GET /api/analysis/{symbol}`
**Response:** Complete report including stance, metrics, and AI insights.

### 3. Compliance Scan
`POST /api/compliance/scan`
**Body:** `{ "text": "..." }`
**Response:** Compliance report with violation details.
