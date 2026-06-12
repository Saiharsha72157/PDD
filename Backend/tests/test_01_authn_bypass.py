"""
test_01_authn_bypass.py ? Test all auth-protected endpoints with:
  (a) no token
  (b) malformed/garbage token
  (c) expired-format token (well-formed but wrong signature)
2xx response on any = FINDING.
"""
import time, requests
from datetime import datetime, timezone
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from test_00_get_token import get_token

BASE = "http://127.0.0.1:8000"

# All endpoints that require auth (Depends(get_current_user))
PROTECTED = [
    ("POST", "/generate-titles",          {"department": "CSE", "domain": "AI"}),
    ("POST", "/analyze-csv",              None),   # multipart ? skip body, probe auth
    ("POST", "/analyze-manual-data",      {"column_names": ["a"], "rows": [[1]]}),
    ("POST", "/regenerate-chart",         {"groups":["A"],"parameters":["x"],"comparison_stats":{"A":{"x":{"mean":1,"sem":0.1}}},"group_col":"grp","title":"t","xlabel":"x","ylabel":"y"}),
    ("POST", "/generate-summary",         {"abstract": "test", "mode": "brief"}),
    ("POST", "/generate-insights",        {"text": "test text"}),
    ("POST", "/generate-literature-review", {"abstracts_text": "test"}),
    ("POST", "/submit-support-ticket",    {"ticket_type": "bug", "email": "x@x.com", "message": "test"}),
    ("GET",  "/search-datasets",          None),
]

BAD_TOKENS = [
    ("no_token",           None),
    ("malformed",          "Bearer NOTAVALIDTOKEN"),
    ("wrong_signature",    "Bearer " + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" + "." + "eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQifQ" + ".INVALIDSIGNATUREPADDING"),
]

def probe(method, url, headers, body):
    t0 = time.time()
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=10)
        else:
            r = requests.post(url, headers=headers, json=body, timeout=10)
        return r.status_code, round((time.time()-t0)*1000)
    except Exception as e:
        return 0, 0

def run(cfg: dict) -> list:
    results = []
    for token_label, auth_val in BAD_TOKENS:
        headers = {"Content-Type": "application/json"}
        if auth_val:
            headers["Authorization"] = auth_val

        for method, path, body in PROTECTED:
            url = BASE + path
            status, elapsed = probe(method, url, headers, body)
            ts = datetime.now(timezone.utc).isoformat()
            finding = 200 <= status <= 299
            severity = "CRITICAL" if finding else "INFO"
            sym = "[!!]" if finding else "[OK]"
            print(f"    [{sym}] AuthN-bypass [{token_label}] {method} {path} -> {status}")
            results.append({
                "endpoint": path,
                "method": method,
                "role": f"unauthenticated:{token_label}",
                "status": status,
                "expected_status": 401,
                "finding": finding,
                "severity": severity,
                "response_time_ms": elapsed,
                "test_category": "authn_bypass",
                "note": f"Token: {token_label} ? got {status}, expected 401/403",
                "timestamp": ts
            })
            time.sleep(0.15)
    return results
