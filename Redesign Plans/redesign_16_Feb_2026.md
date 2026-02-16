Plan to implement                                                                        │
│                                                                                          │
│ Plan: Redesign Analysis Results Page UI                                                  │
│                                                                                          │
│ Context  
| Do not refer the docs folder, as the files inside that are not updated                   │
│                                                                                          │
│ The scraper redesign (completed) now provides far more data than the UI displays. The    │
│ current analysis page (720-line AnalysisClient.tsx) has:                                 │
│ - No charts despite recharts@^3.7.0 being installed                                      │
│ - Duplicate sections (Data Integrity appears in both left AND right columns)             │
│ - Missing data - shareholding, efficiency ratios, multi-year financials, cash flow       │
│ breakdown, key ratios (market cap, book value, dividend yield) are all available but not │
│  shown                                                                                   │
│ - Inconsistent card styling - some cards use light-mode bg classes that get overridden   │
│ - The inference for user is very limited. The modal that opens about information should hold every valuable information about the metric, its definition, the current value of that metric for that specific stock, its impact etc.
                                                                                         │
│ Files to Modify                                                                          │
│                                                                                          │
│ File: backend/engines/merger.py                                                          │
│ Change: Pass shareholding through to data context                                        │
│ ────────────────────────────────────────                                                 │
│ File: backend/services/analysis_service.py                                               │
│ Change: Add shareholding, key_ratios, financials to API response                         │
│ ────────────────────────────────────────                                                 │
│ File: frontend/src/app/analysis/[symbol]/AnalysisClient.tsx                              │
│ Change: Full UI redesign - decompose into sections                                       │
│ ────────────────────────────────────────                                                 │
│ File: frontend/src/app/analysis/[symbol]/sections/FinancialCharts.tsx                    │
│ Change: NEW - Multi-year recharts visualizations                                         │
│ ────────────────────────────────────────                                                 │
│ File: frontend/src/app/analysis/[symbol]/sections/ShareholdingCard.tsx                   │
│ Change: NEW - Pie chart + table                                                          │
│ ────────────────────────────────────────                                                 │
│ File: frontend/src/app/analysis/[symbol]/sections/FundamentalScorecard.tsx               │
│ Change: NEW - Radar chart replacing progress bars                                        │
│ ────────────────────────────────────────                                                 │
│ File: frontend/src/app/analysis/[symbol]/sections/BenchmarkComparison.tsx                │
│ Change: NEW - Horizontal bar chart replacing text rows                                   │
│ ────────────────────────────────────────                                                 │
│ File: frontend/src/components/MetricExplanationModal.tsx                                 │
│ Change: Add 17 new metric explanations       

| I have updated a logo for the app. It is available in the Redesign Plans folder as .png file.  
Make the whole app background resonating with the logo. Animate the background and overall design of the app.                                          │
│                                                                                          │
│ Phase 1: Backend Plumbing                                                                │
│                                                                                          │
│ 1A. merger.py (line 64-119)                                                              │
│                                                                                          │
│ - Add shareholding = raw.get("shareholding", {}) after line 88                           │
│ - Add "shareholding": shareholding to merged_context dict                                │
│                                                                                          │
│ 1B. analysis_service.py (line 50-68)                                                     │
│                                                                                          │
│ Add to perform_full_analysis return dict:                                                │
│ - "shareholding": data_context.get("shareholding", {})                                   │
│ - "key_ratios": data_context.get("key_ratios", {})                                       │
│ - "financials": data_context.get("financials", {}) (multi-year data for charts)          │
│                                                                                          │
│ Phase 2: Frontend TypeScript Interfaces                                                  │
│                                                                                          │
│ Expand AnalysisData interface in AnalysisClient.tsx with:                                │
│ interface Financials {                                                                   │
│     income_statement: Record<string, Record<string, number | null>>;                     │
│     balance_sheet: Record<string, Record<string, number | null>>;                        │
│     cashflow: Record<string, Record<string, number | null>>;                             │
│     ratios_table: Record<string, Record<string, number | null>>;                         │
│ }                                                                                        │
│ interface Shareholding {                                                                 │
│     Promoters?: number; FIIs?: number; DIIs?: number;                                    │
│     Government?: number; Public?: number; Others?: number;                               │
│     "No. of Shareholders"?: number; as_of?: string;                                      │
│ }                                                                                        │
│ interface KeyRatios {                                                                    │
│     market_cap?: number; book_value?: number; dividend_yield?: number;                   │
│     roce?: number; roe?: number; face_value?: number;                                    │
│     high_low?: string; debt_to_equity?: number; pe_ratio?: number;                       │
│ }                                                                                        │
│                                                                                          │
│ Phase 3: Section-by-Section Redesign                                                     │
│                                                                                          │
│ Section 1: Header Card (KEEP + enhance)                                                  │
│                                                                                          │
│ - Keep: Symbol, stance badge, name, description, sector pills, price, PDF button         │
│ - Add: Market Cap (from key_ratios), 52-wk High/Low, Book Value, Dividend Yield badge    │
│ - Price area becomes a mini-grid: Price + Market Cap top row, High/Low + Book Value      │
│ bottom                                                                                   │
│                                                                                          │
│ Section 2: Key Metrics Dashboard (REDESIGN to 2 rows of 5)                               │
│                                                                                          │
│ Layout: grid-cols-2 sm:grid-cols-3 lg:grid-cols-5                                        │
│                                                                                          │
│ Row 1: ROE, ROCE (NEW), Net Margin, D/E, P/E                                             │
│ Row 2: F-Score, Z-Score, Revenue CAGR, Overall Score /10, Dividend Yield (NEW)           │
│                                                                                          │
│ Remove: Margin Stability card (moves into Financial Metrics Growth tab), ROA card (stays │
│  in Profitability tab). Eliminates the separate "Secondary Metrics Row" entirely.        │
│                                                                                          │
│ Section 3: Financial Trend Charts (NEW - full width)                                     │
│                                                                                          │
│ Tabbed recharts visualizations using multi-year financials data:                         │
│                                                                                          │
│ Tab 1 - Revenue & Profit: BarChart (revenue bars) + Line overlay (net income) + OPM%     │
│ secondary axis                                                                           │
│ Tab 2 - Balance Sheet: Stacked BarChart showing Equity Capital, Reserves, Total Debt,    │
│ Other Liabilities over time                                                              │
│ Tab 3 - Cash Flow: Grouped BarChart (Operating/Investing/Financing CF) + Net Cash Flow   │
│ line                                                                                     │
│ Tab 4 - Efficiency Ratios: LineChart with Debtor Days, Working Capital Days, ROCE% lines │
│                                                                                          │
│ Chart theme: violet bars (#8B5CF6), green lines (#34D399), blue secondary (#60A5FA),     │
│ slate grid (#334155), slate-400 text                                                     │
│                                                                                          │
│ Section 4: Two-Column Layout (8/12 + 4/12)                                               │
│                                                                                          │
│ LEFT COLUMN (8/12):                                                                      │
│                                                                                          │
│ 4A. Stance Card - KEEP as-is (gradient card with AI verdict). Well designed.             │
│                                                                                          │
│ 4B. Financial Metrics Tabs - KEEP structure, ENRICH content:                             │
│ - Growth tab: add Net Income growth alongside Revenue CAGR                               │
│ - Profitability tab: add ROCE (from key_ratios), OPM% (from latest income statement)     │
│ - Leverage tab: add Interest Coverage (EBIT / Interest Expense)                          │
│ - Valuation tab: add Price-to-Book, Dividend Yield                                       │
│ - Quality tab: unchanged                                                                 │
│                                                                                          │
│ 4C. Financial Integrity Audit - KEEP left column version only. DELETE the right column   │
│ duplicate "Data Integrity Summary" card (lines 651-696).                                 │
│                                                                                          │
│ 4D. AI Perspectives - KEEP, extract to sections/AIPerspectives.tsx for file size         │
│ management.                                                                              │
│                                                                                          │
│ RIGHT COLUMN (4/12):                                                                     │
│                                                                                          │
│ 4E. Fundamental Scorecard - REDESIGN: Replace 3 progress bars with a RadarChart showing  │
│ Business Quality, Financial Safety, Valuation Comfort on 3 axes. Keep overall score      │
│ number below.                                                                            │
│                                                                                          │
│ 4F. Sector Benchmarks - REDESIGN: Replace text rows with horizontal BarChart showing     │
│ company vs sector average pairs for ROE, P/E, D/E, Net Margin. Company bars in indigo,   │
│ sector in slate.                                                                         │
│                                                                                          │
│ 4G. Shareholding Pattern (NEW): PieChart showing Promoters/FIIs/DIIs/Government/Public   │
│ with a percentage legend and "No. of Shareholders" count below. Color scheme: violet     │
│ (promoters), blue (FIIs), green (DIIs), amber (govt), rose (public).                     │
│                                                                                          │
│ 4H. Key Ratios Summary (NEW): Compact card with Market Cap, Book Value, Face Value,      │
│ 52-wk High/Low, Promoter Holding%.                                                       │
│                                                                                          │
│ Section 5: Disclaimer (KEEP)                                                             │
│                                                                                          │
│ Phase 4: New MetricExplanation Entries                                                   │
│                                                                                          │
│ Add 17 entries to MetricExplanationModal.tsx:                                            │
│ ROCE, Dividend Yield, Book Value, Market Cap, OPM, Interest Coverage, Price to Book,     │
│ Debtor Days, Inventory Days, Working Capital Days, Cash Conversion Cycle, Shareholding   │
│ Pattern, Promoter Holding, FII Holding, DII Holding, Operating Cash Flow, Net Cash Flow  │
│                                                                                          │
│ Final Page Layout                                                                        │
│                                                                                          │
│ [======================== FULL WIDTH ===========================]                        │
│ [ HEADER: Symbol | Stance | Name | Desc | Price+MCap+HiLo+BV   ]                         │
│ [===============================================================]                        │
│ [ ROE  ][ ROCE ][ NM   ][ D/E  ][ P/E  ]  <- 5-col metric bar                            │
│ [ F-Sc ][ Z-Sc ][ CAGR ][ /10  ][ DivY ]  <- 5-col metric bar                            │
│ [===============================================================]                        │
│ [ FINANCIAL CHARTS (4 tabs)                                     ]                        │
│ [ Revenue&Profit | Balance Sheet | Cash Flow | Efficiency       ]                        │
│ [ [============= recharts area ============================]    ]                        │
│ [===============================================================]                        │
│ [ LEFT 8/12                          ][ RIGHT 4/12             ]                         │
│ [ Stance Card (AI verdict)           ][ Scorecard (RadarChart) ]                         │
│ [ Financial Metrics (5 tabs enriched)][ Benchmarks (BarChart)  ]                         │
│ [ Integrity Audit (single)           ][ Shareholding (PieCht)  ]                         │
│ [ AI Perspectives (3 tabs)           ][ Key Ratios Summary     ]                         │
│ [====================================][========================]                         │
│ [ DISCLAIMER                                                    ]                        │
│ [===============================================================]                        │
│                                                                                          │
│ Verification                                                                             │
│                                                                                          │
│ 1. cd backend && source venv/bin/activate && PORT=5002 python app.py - start backend     │
│ 2. cd frontend && npm run dev - start frontend                                           │
│ 3. Navigate to /analysis/RELIANCE and verify:                                            │
│   - All 4 chart tabs render with real multi-year data                                    │
│   - Shareholding pie chart shows correct percentages                                     │
│   - Radar chart shows 3 pillars                                                          │
│   - Benchmark bar chart shows company vs sector                                          │
│   - Key metrics bar shows 10 metrics in 2 rows                                           │
│   - Header shows Market Cap, High/Low, Book Value                                        │
│   - No duplicate Data Integrity sections                                                 │
│   - All new metrics have working InfoTip modals                                          │
│ 4. cd frontend && npm run build - verify no build errors                                 │
│ 5. Test mobile responsiveness at 375px width    
