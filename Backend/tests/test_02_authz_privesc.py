"""
test_02_authz_privesc.py ? This app has a single user role (authenticated).
Tests whether the valid user JWT can access any unintended admin-only paths
or undocumented routes.  Also checks public endpoints don't require auth
when they shouldn't.
"""
import time, requests
from datetime import datetime, timezone
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from test_00_get_token import get_token

BASE = "http://127.0.0.1:8000"

# Endpoints that are PUBLIC (no auth required) per codebase
PUBLIC_ENDPOINTS = [
    ("GET",  "/"),
    ("GET",  "/health"),
    ("POST", "/paraphrase"),
    ("POST", "/writing-analysis"),
]

# Admin/elevated paths to probe ? these should not exist/not return 200
ADMIN_PROBES = [
    ("GET",  "/admin"),
    ("GET",  "/users"),
    ("GET",  "/admin/users"),
    ("GET",  "/api/admin"),
    ("GET",  "/debug"),
    ("GET",  "/config"),
    ("GET",  "/env"),
    ("GET",  "/docs"),         # FastAPI auto-generated docs ? may expose schema
    ("GET",  "/openapi.json"), # OpenAPI spec
    ("GET",  "/redoc"),
]

def probe(method, url, headers=None, body=None):
    t0 = time.time()
    try:
        h = headers or {}
        if method == "GET":
            r = requests.get(url, headers=h, timeout=10)
        else:
            r = requests.post(url, headers=h, json=body or {}, timeout=10)
        return r.status_code, round((time.time()-t0)*1000)
    except Exception:
        return 0, 0

def run(cfg: dict) -> list:
    results = []
    token = get_token()
    auth_headers = {"Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"} if token else {}

    # 1. Public endpoints ? should return 2xx WITHOUT a token
    for method, path in PUBLIC_ENDPOINTS:
        url = BASE + path
        body = None
        if path == "/paraphrase":
            body = {"text": "Hello world", "mode": "standard"}
        elif path == "/writing-analysis":
            body = {"text": "Hello world"}

        status, elapsed = probe(method, url, body=body)
        ts = datetime.now(timezone.utc).isoformat()
        # Public endpoint returning 4xx is also a finding (unnecessary auth wall)
        expected_range = range(200, 300)
        finding = status not in expected_range and status != 0
        severity = "LOW" if finding else "INFO"
        sym = "[??]" if finding else "[OK]"
        print(f"    [{sym}] Public-access {method} {path} -> {status}")
        results.append({
            "endpoint": path,
            "method": method,
            "role": "anonymous",
            "status": status,
            "expected_status": 200,
            "finding": finding,
            "severity": severity,
            "response_time_ms": elapsed,
            "test_category": "authz_public_access",
            "note": f"Public endpoint returned {status}",
            "timestamp": ts
        })
        time.sleep(0.15)

    # 2. Admin/elevated path probes with valid user token
    for method, path in ADMIN_PROBES:
        url = BASE + path
        status, elapsed = probe(method, url, headers=auth_headers)
        ts = datetime.now(timezone.utc).isoformat()
        # /docs and /openapi.json accessible = LOW finding (info disclosure)
        # Any actual data path = HIGH
        finding = 200 <= status <= 299
        if finding:
            if path in ("/docs", "/openapi.json", "/redoc"):
                severity = "LOW"
                note = f"API docs exposed publicly ? consider disabling in production"
            else:
                severity = "HIGH"
                note = f"Unexpected admin/elevated path accessible ? got {status}"
        else:
            severity = "INFO"
            note = f"Correctly denied ? got {status}"
        sym = "[!!]" if finding and severity != "LOW" else ("[??]" if finding else "[OK]")
        print(f"    [{sym}] Admin-probe {method} {path} -> {status} [{severity}]")
        results.append({
            "endpoint": path,
            "method": method,
            "role": "user",
            "status": status,
            "expected_status": 404,
            "finding": finding,
            "severity": severity,
            "response_time_ms": elapsed,
            "test_category": "authz_privesc",
            "note": note,
            "timestamp": ts
        })
        time.sleep(0.15)

    return results
