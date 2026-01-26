import json
import re
import os
from typing import List, Dict, Tuple, Any

class ComplianceScanner:
    def __init__(self, registry_path: str = None):
        if registry_path is None:
            registry_path = os.path.join(os.path.dirname(__file__), 'forbidden_language.json')
        
        with open(registry_path, 'r') as f:
            self.registry = json.load(f)
        
        self.exact_matches = [term.lower() for term in self.registry['exact_matches']]
        self.patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.registry['patterns']]
        self.disclaimer = self.registry['disclaimer']

    def scan(self, text: str) -> Dict[str, Any]:
        """
        Scans text for forbidden language and returns a list of violations.
        """
        violations = []
        lower_text = text.lower()

        # Check for exact matches
        for term in self.exact_matches:
            # Use word boundaries to avoid partial matches (e.g., 'buys' containing 'buy')
            pattern = rf'\b{re.escape(term)}\b'
            matches = re.finditer(pattern, lower_text)
            for match in matches:
                violations.append({
                    "type": "exact_match",
                    "term": term,
                    "position": match.start(),
                    "matched_text": match.group(),
                    "severity": "high"
                })

        # Check for pattern matches
        for pattern in self.patterns:
            matches = pattern.finditer(text)
            for match in matches:
                violations.append({
                    "type": "pattern_match",
                    "pattern": pattern.pattern,
                    "position": match.start(),
                    "matched_text": match.group(),
                    "severity": "high"
                })

        # Deduplicate violations based on position and text
        # (Exact matches and patterns might overlap)
        unique_violations = []
        seen = set()
        for v in violations:
            key = (v['position'], v['matched_text'])
            if key not in seen:
                unique_violations.append(v)
                seen.add(key)

        return {
            "is_compliant": len(unique_violations) == 0,
            "violations": unique_violations,
            "violation_count": len(unique_violations)
        }

    def inject_disclaimer(self, text: str) -> str:
        """
        Appends the mandatory disclaimer to the text.
        """
        return f"{text}\n\n{self.disclaimer}"

# Simple usage example
if __name__ == "__main__":
    scanner = ComplianceScanner()
    test_text = "This stock is a strong buy with a target price of 500. Guaranteed returns!"
    result = scanner.scan(test_text)
    print(json.dumps(result, indent=2))
    print(scanner.inject_disclaimer("Sample analysis report content."))
