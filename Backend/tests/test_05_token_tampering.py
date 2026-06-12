"""
test_05_token_tampering.py ? Flip JWT claims without re-signing.
Server must reject all tampered tokens with 401/403. 2xx = CRITICAL finding.
"""
import base64, json, time, requests
from datetime import datetime, timezone
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from test_00_get_token import get_token

BASE = "http://127.0.0.1:8000"

def b64_pad(s):
    return s + '=' * (-len(s) % 4)

def tamper_jwt(token: str, new_payload: dict, alg_none: bool = False) -> str:
    """Replace the payload with new_payload but keep original header and signature."""
    parts = token.split(".")
    if len(parts) != 3:
        return token
    new_payload_b64 = base64.urlsafe_b64encode(
        json.dumps(new_payload).encode()
    ).rstrip(b"=").decode()
    if alg_none:
        new_header = base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').rstrip(b"=").decode()
        return f"{new_header}.{new_payload_b64}."
    return f"{parts[0]}.{new_payload_b64}.{parts[2]}"

def decode_payload(token: str) -> dict:
    parts = token.split(".")
    if len(parts) < 2:
        return {}
    try:
        return json.loads(base64.urlsafe_b64decode(b64_pad(parts[1])))
    except Exception:
        return {}

PROBE_ENDPOINT = ("POST", "/generate-titles", {"department": "CSE", "domain": "AI"})

def run(cfg: dict) -> list:
    results = []
    token = get_token()
    if not token:
        results.append({
            "endpoint": PROBE_ENDPOINT[1], "method": PROBE_ENDPOINT[0],
            "role": "tampered", "status": 0, "expected_status": 401,
            "finding": False, "severity": "INFO",
            "response_time_ms": 0, "test_category": "token_tampering",
            "note": "No token available ? skipping token tampering tests",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return results

    original_payload = decode_payload(token)

    tampers = [
        ("role_elevated",    {**original_payload, "role": "service_role"}),
        ("role_admin",       {**original_payload, "role": "admin"}),
        ("sub_changed",      {**original_payload, "sub": "00000000-0000-0000-0000-000000000001"}),
        ("exp_far_future",   {**original_payload, "exp": 9999999999}),
        ("email_changed",    {**original_payload, "email": "attacker@evil.com"}),
        ("aud_changed",      {**original_payload, "aud": "service_role"}),
        ("alg_none_attempt", {**original_payload}),  # keep payload, just invalid sig
    ]

    method, path, body = PROBE_ENDPOINT
    url = BASE + path

    for label, payload in tampers:
        tampered = tamper_jwt(token, payload, alg_none=(label == "alg_none_attempt"))
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {tampered}"
        }
        ts = datetime.now(timezone.utc).isoformat()
        t0 = time.time()
        try:
            r = requests.post(url, headers=headers, json=body, timeout=10)
            elapsed = round((time.time()-t0)*1000)
            finding = 200 <= r.status_code <= 299
            severity = "CRITICAL" if finding else "INFO"
            sym = "[!!]" if finding else "[OK]"
            print(f"    [{sym}] Token-tamper [{label}] -> {r.status_code}")
            results.append({
                "endpoint": path, "method": method,
                "role": f"tampered:{label}",
                "status": r.status_code, "expected_status": 401,
                "finding": finding, "severity": severity,
                "response_time_ms": elapsed,
                "test_category": "token_tampering",
                "note": f"Tamper [{label}] returned {r.status_code} ? {'VULNERABLE: accepts tampered JWT!' if finding else 'correctly rejected'}",
                "timestamp": ts
            })
        except Exception as e:
            results.append({
                "endpoint": path, "method": method,
                "role": f"tampered:{label}",
                "status": 0, "expected_status": 401,
                "finding": False, "severity": "INFO",
                "response_time_ms": 0, "test_category": "token_tampering",
                "note": f"Exception: {e}", "timestamp": ts
            })
        time.sleep(0.2)

    return results
