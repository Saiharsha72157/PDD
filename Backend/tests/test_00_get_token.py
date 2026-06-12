"""
test_00_get_token.py ? Obtain a real Supabase JWT using email+password.
Writes token to savepoint so subsequent tests can use it.
"""
import json, os, time, requests
from datetime import datetime, timezone

from dotenv import load_dotenv
load_dotenv()
SUPABASE_URL   = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON  = os.environ.get("SUPABASE_ANON", "")

TOKEN_FILE = os.path.join(os.path.dirname(__file__), "_token.json")

def run(cfg: dict) -> list:
    results = []
    email    = cfg.get("email", "")
    password = cfg.get("password", "")

    ts = datetime.now(timezone.utc).isoformat()
    t0 = time.time()
    try:
        resp = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                "apikey": SUPABASE_ANON,
                "Content-Type": "application/json"
            },
            json={"email": email, "password": password},
            timeout=15
        )
        elapsed = round((time.time() - t0) * 1000)
        data = resp.json()
        token = data.get("access_token", "")
        finding = resp.status_code != 200

        if token:
            with open(TOKEN_FILE, "w") as f:
                json.dump({"token": token, "email": email}, f)
            print(f"    [[OK]] JWT obtained for {email} (len={len(token)})")
        else:
            print(f"    [[!!]] Login failed: {resp.status_code} ? {data.get('error_description','')}")

        results.append({
            "endpoint": "/auth/v1/token",
            "method": "POST",
            "role": "user",
            "status": resp.status_code,
            "expected_status": 200,
            "finding": finding,
            "severity": "CRITICAL" if finding else "INFO",
            "response_time_ms": elapsed,
            "test_category": "token_acquisition",
            "note": "Login OK ? JWT stored" if token else f"Login failed: {data.get('error_description','')}",
            "timestamp": ts
        })
    except Exception as e:
        results.append({
            "endpoint": "/auth/v1/token",
            "method": "POST",
            "role": "user",
            "status": 0,
            "expected_status": 200,
            "finding": True,
            "severity": "CRITICAL",
            "response_time_ms": 0,
            "test_category": "token_acquisition",
            "note": f"Exception: {e}",
            "timestamp": ts
        })
    return results

def get_token() -> str:
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE) as f:
            return json.load(f).get("token", "")
    return ""
