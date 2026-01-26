from nsepython import nse_eq
import json

symbol = "RELIANCE"
try:
    data = nse_eq(symbol)
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
