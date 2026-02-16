export interface Financials {
    income_statement: Record<string, Record<string, number | null>>;
    balance_sheet: Record<string, Record<string, number | null>>;
    cashflow: Record<string, Record<string, number | null>>;
    ratios_table: Record<string, Record<string, number | null>>;
}

export interface Shareholding {
    Promoters?: number;
    FIIs?: number;
    DIIs?: number;
    Government?: number;
    Public?: number;
    Others?: number;
    "No. of Shareholders"?: number;
    as_of?: string;
}

export interface KeyRatios {
    market_cap?: number;
    book_value?: number;
    dividend_yield?: number;
    roce?: number;
    roe?: number;
    face_value?: number;
    high_low?: string | number;
    debt_to_equity?: number;
    pe_ratio?: number;
    promoter_holding?: number;
}

export interface PillarScores {
    business_quality: number;
    financial_safety: number;
    valuation_comfort: number;
}

export interface BenchmarkComp {
    status: string;
    diff_pct: number;
}

export interface AnalysisData {
    symbol: string;
    profile: {
        name: string;
        sector: string | null;
        industry: string | null;
        description: string;
    };
    price: {
        current: number;
        date: string;
        history: { date: string; close: number; volume: number }[];
    };
    ratios: {
        profitability: { roe: number; roa: number; net_margin: number };
        leverage: { debt_to_equity: number };
        valuation: { pe_ratio: number; price: number };
        quality_scores: { piotroski_f_score: number; altman_z_score: number };
        growth_trends: { revenue_cagr_3y: number; margin_stability: string; data_points: number };
    };
    stance: {
        overall_stance: string;
        pillar_scores: PillarScores;
        overall_score: number;
        red_flags: string[];
    };
    ai_insights: {
        analyst: string;
        contrarian: string;
        educator: string;
        final_verdict: string;
    };
    benchmarks: {
        sector: string | null;
        averages: { avg_roe: number; avg_pe: number; avg_debt_equity: number; avg_net_margin: number };
        comparisons: Record<string, BenchmarkComp>;
    };
    integrity_audit: {
        is_valid: boolean;
        warnings: string[];
        data_completeness: {
            screener_available: boolean;
            confidence: number;
        };
    };
    financials?: Financials;
    shareholding?: Shareholding;
    key_ratios?: KeyRatios;
}
