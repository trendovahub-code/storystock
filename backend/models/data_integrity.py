from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Union, Any
from datetime import datetime
import re

class MetricValue(BaseModel):
    value: Union[float, int, None]
    unit: str
    source: str  # 'screener', 'computed'
    reliability: str = 'high'  # 'high', 'medium', 'low'
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    computation_formula: Optional[str] = None
    source_values: Optional[Dict[str, float]] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DataIntegrityRules:
    @staticmethod
    def validate_range(metric_name: str, value: float) -> bool:
        """
        Validates if a metric value is within a reasonable range.
        """
        ranges = {
            "pe_ratio": (0, 1000),
            "pb_ratio": (0, 100),
            "roe": (-100, 200),
            "market_cap": (0, 50000000)  # In Cr
        }
        
        if metric_name in ranges:
            min_val, max_val = ranges[metric_name]
            return min_val <= value <= max_val
        return True

    @staticmethod
    def detect_hallucination(llm_text: str, source_data: Dict[str, Any]) -> List[str]:
        """
        Scans LLM output for numbers and cross-checks them against source data.
        Returns a list of potential hallucinations.
        """
        # Regex to find numbers (including decimals and commas)
        number_pattern = re.compile(r'\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b')
        found_numbers = number_pattern.findall(llm_text)
        
        # Extract all numeric values from source data for comparison
        def extract_numbers(obj):
            nums = []
            if isinstance(obj, (int, float)):
                nums.append(round(float(obj), 2))
            elif isinstance(obj, dict):
                for v in obj.values():
                    nums.extend(extract_numbers(v))
            elif isinstance(obj, list):
                for v in obj:
                    nums.extend(extract_numbers(v))
            return nums

        source_numbers = set(extract_numbers(source_data))
        hallucinations = []

        for num_str in found_numbers:
            num = round(float(num_str.replace(',', '')), 2)
            if num not in source_numbers:
                hallucinations.append(f"Number {num_str} not found in source data")

        return hallucinations
