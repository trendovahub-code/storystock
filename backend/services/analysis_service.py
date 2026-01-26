from engines.ratio_engine import RatioEngine
from engines.stance_engine import StanceEngine
from engines.benchmarking_engine import BenchmarkingEngine
from llm.orchestrator import LLMOrchestrator
from models.data_integrity import DataIntegrityRules
from typing import Dict, Any

class AnalysisService:
    def __init__(self):
        self.ratio_engine = RatioEngine()
        self.stance_engine = StanceEngine()
        self.benchmarking_engine = BenchmarkingEngine()
        self.llm_orchestrator = LLMOrchestrator()
        self.integrity_rules = DataIntegrityRules()

    def perform_full_analysis(self, data_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs the end-to-end analysis on the provided data context.
        """
        # 1. Compute Ratios
        ratios = self.ratio_engine.compute_ratios(data_context)
        
        # 2. Determine Fundamental Stance
        stance_result = self.stance_engine.determine_stance(ratios)
        
        # 3. Sector Benchmarking
        sector = data_context.get("profile", {}).get("sector", "Default")
        benchmarks = self.benchmarking_engine.get_benchmark_comparison(sector, ratios)

        # 4. Inject LLM Perspectives
        analysis_context = {
            "symbol": data_context.get("symbol"),
            "profile": data_context.get("profile"),
            "ratios": ratios,
            "stance": stance_result,
            "benchmarks": benchmarks
        }
        ai_insights = self.llm_orchestrator.generate_all_perspectives(analysis_context)

        # 5. Data Integrity Check (Audit)
        validation_errors = []
        for cat, metric_dict in ratios.items():
            for name, val in metric_dict.items():
                if isinstance(val, (int, float)):
                    if not self.integrity_rules.validate_range(name, val):
                        validation_errors.append(f"Metric '{name}' has suspicious value: {val}")

        return {
            "symbol": data_context.get("symbol"),
            "profile": data_context.get("profile"),
            "price": data_context.get("price"),
            "ratios": ratios,
            "stance": stance_result,
            "benchmarks": benchmarks,
            "ai_insights": ai_insights,
            "integrity_audit": {
                "is_valid": len(validation_errors) == 0,
                "warnings": validation_errors,
                "data_completeness": data_context.get("quality_audit")
            }
        }
