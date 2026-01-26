from unittest.mock import MagicMock, patch
from providers.yfinance_provider import YFinanceProvider
from providers.nse_provider import NSEPythonProvider
from engines.merger import DataMerger
from services.analysis_service import AnalysisService

def test_yfinance_provider():
    provider = YFinanceProvider()
    data = provider.get_stock_info("RELIANCE")
    assert data["name"] is not None
    assert data["source"] == "yfinance"

def test_nse_provider():
    provider = NSEPythonProvider()
    data = provider.get_stock_info("RELIANCE")
    assert data["name"] is not None
    assert data["source"] == "nsepython"

def test_data_merger():
    merger = DataMerger()
    context = merger.merge_stock_data("RELIANCE")
    assert context["symbol"] == "RELIANCE"
    assert context["profile"]["name"] is not None
    assert context["price"]["current"] > 0

@patch('llm.orchestrator.LLMOrchestrator.generate_all_perspectives')
def test_analysis_service(mock_llm):
    # Mock LLM response
    mock_llm.return_value = {
        "analyst": "Strong buy",
        "contrarian": "Too expensive",
        "educator": "Watch the PE"
    }
    
    merger = DataMerger()
    context = merger.merge_stock_data("RELIANCE")
    
    service = AnalysisService()
    report = service.perform_full_analysis(context)
    
    assert report["symbol"] == "RELIANCE"
    assert "ratios" in report
    assert "stance" in report
    assert report["ai_insights"]["analyst"] == "Strong buy"
    assert "integrity_audit" in report
