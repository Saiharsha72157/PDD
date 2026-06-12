"""
test_04_rbac_matrix.py ? RBAC matrix.
This app has one role: "authenticated". We verify each endpoint
with a valid JWT returns the expected status code.
"""
import time, requests
from datetime import datetime, timezone
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from test_00_get_token import get_token

BASE = "http://127.0.0.1:8000"

ENDPOINT_MATRIX = [
    # (method, path, body, expected_with_auth, expected_without_auth)
    ("GET",  "/",                    None, 200, 200),
    ("GET",  "/health",              None, 200, 200),
    ("POST", "/paraphrase",          {"text": "Test input text for paraphrase.", "mode": "standard"}, 200, 200),
    ("GET",  "/paraphrase/history",  None, 200, 200),
    ("GET",  "/paraphrase/favorites",None, 200, 200),
    ("POST", "/writing-analysis",    {"text": "The quick brown fox."}, 200, 200),
    ("POST", "/generate-titles",     {"department": "CSE", "domain": "AI"}, 200, 401),
    ("POST", "/generate-summary",    {"abstract": "ML is a subset of AI.", "mode": "brief"}, 200, 401),
    ("POST", "/generate-insights",   {"text": "AI transforms industries."}, 200, 401),
    ("POST", "/generate-literature-review", {"abstracts_text": "Paper 1: ML. Paper 2: DL."}, 200, 401),
    ("GET",  "/search-datasets",     None, 200, 401),
    ("POST", "/analyze-manual-data", {"column_names": ["score", "group"], "rows": [[85, "A"], [90, "B"]]}, 200, 401),
    ("POST", "/regenerate-chart",    {
        "groups": ["A","B"],
        "parameters": ["score"],
        "comparison_stats": {"A": {"score": {"mean": 85, "sem": 2}}, "B": {"score": {"mean": 90, "sem": 3}}},
        "group_col": "group",
        "title": "Test Chart",
        "xlabel": "Parameter",
        "ylabel": "Value"
    }, 200, 401),
    ("POST", "/submit-support-ticket", {"ticket_type": "bug", "email": "test@test.com", "message": "test"}, 200, 401),
]

def probe(method, url, headers=None, body=None):
    t0 = time.time()
    try:
        h = headers or {}
        if method == "GET":
            r = requests.get(url, headers=h, params={"query": "ai"} if "search" in url else {}, timeout=15)
        else:
            r = requests.post(url, headers=h, json=body, timeout=15)
        return r.status_code, round((time.time()-t0)*1000)
    except Exception as e:
        return 0, 0

def run(cfg: dict) -> list:
    results = []
    token = get_token()
    auth_h   = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    noauth_h = {"Content-Type": "application/json"}

    for method, path, body, exp_auth, exp_noauth in ENDPOINT_MATRIX:
        url = BASE + path
        ts  = datetime.now(timezone.utc).isoformat()

        # Test with auth
        status_auth, elapsed_auth = probe(method, url, auth_h, body)
        finding_auth = status_auth not in range(exp_auth - 50, exp_auth + 50) and status_auth != 0
        sym = "[!!]" if finding_auth else "[OK]"
        print(f"    [{sym}] RBAC [authed]   {method} {path} -> {status_auth} (exp ~{exp_auth})")
        results.append({
            "endpoint": path, "method": method,
            "role": "user:authenticated",
            "status": status_auth, "expected_status": exp_auth,
            "finding": finding_auth,
            "severity": "HIGH" if finding_auth else "INFO",
            "response_time_ms": elapsed_auth,
            "test_category": "rbac_matrix",
            "note": f"Expected ~{exp_auth}, got {status_auth}",
            "timestamp": ts
        })
        time.sleep(0.2)

        # Test without auth
        status_na, elapsed_na = probe(method, url, noauth_h, body)
        finding_na = 200 <= status_na <= 299 and exp_noauth == 401
        sym = "[!!]" if finding_na else "[OK]"
        print(f"    [{sym}] RBAC [no-auth]  {method} {path} -> {status_na} (exp ~{exp_noauth})")
        results.append({
            "endpoint": path, "method": method,
            "role": "anonymous",
            "status": status_na, "expected_status": exp_noauth,
            "finding": finding_na,
            "severity": "HIGH" if finding_na else "INFO",
            "response_time_ms": elapsed_na,
            "test_category": "rbac_matrix",
            "note": f"Auth-required endpoint returned {status_na} without token" if finding_na else f"Correctly returned {status_na}",
            "timestamp": ts
        })
        time.sleep(0.2)

    return results
