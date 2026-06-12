"""Quick standalone runner for test_00 to print result."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(os.path.dirname(__file__), '..', 'automated_tests', 'input.json')) as f:
    import json
    cfg = json.load(f)

import test_00_get_token
results = test_00_get_token.run(cfg)
for r in results:
    print(json.dumps(r, indent=2))

token = test_00_get_token.get_token()
print(f"\nToken present: {bool(token)}, length: {len(token)}")
