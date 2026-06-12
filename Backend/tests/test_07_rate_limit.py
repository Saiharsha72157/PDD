"""
test_07_rate_limit.py ? Burst 30 requests to check if rate limiting is enforced.
If all 30 return 2xx ? NO rate limiting present ? MEDIUM finding.
"""
import time, requests, threading
from datetime import datetime, timezone
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from test_00_get_token import get_token

BASE = "http://127.0.0.1:8000"
BURST = 30

def run(cfg: dict) -> list:
    results = []
    token = get_token()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # Test on the no-auth /paraphrase endpoint (fastest)
    endpoint = "/paraphrase"
    url = BASE + endpoint
    body = {"text": "Rate limit test probe.", "mode": "standard"}

    statuses = []
    times = []
    ts_start = datetime.now(timezone.utc).isoformat()

    print(f"    [*] Firing {BURST} requests to {endpoint} ...")
    for i in range(BURST):
        t0 = time.time()
        try:
            r = requests.post(url, headers=headers, json=body, timeout=10)
            elapsed = round((time.time()-t0)*1000)
            statuses.append(r.status_code)
            times.append(elapsed)
        except Exception:
            statuses.append(0)
            times.append(0)
        time.sleep(0.05)  # ~20 rps

    rate_limited = any(s == 429 for s in statuses)
    all_ok = all(200 <= s <= 299 for s in statuses if s > 0)
    finding = not rate_limited
    severity = "MEDIUM" if finding else "INFO"
    sym = "[??]" if finding else "[OK]"

    print(f"    [{sym}] Rate limit: 429s={statuses.count(429)}  2xx={sum(1 for s in statuses if 200<=s<=299)}  errors={statuses.count(0)}")
    results.append({
        "endpoint": endpoint,
        "method": "POST",
        "role": "anonymous",
        "status": statuses[-1] if statuses else 0,
        "expected_status": 429,
        "finding": finding,
        "severity": severity,
        "response_time_ms": round(sum(times)/len(times)) if times else 0,
        "test_category": "rate_limiting",
        "note": f"Burst {BURST} reqs. 429s={statuses.count(429)}, 2xx={sum(1 for s in statuses if 200<=s<=299)}. {'No rate limiting detected!' if finding else 'Rate limiting active'}",
        "timestamp": ts_start
    })

    # Also test the auth endpoint /generate-titles
    if token:
        endpoint2 = "/generate-titles"
        url2 = BASE + endpoint2
        body2 = {"department": "CSE", "domain": "AI"}
        statuses2 = []
        ts2 = datetime.now(timezone.utc).isoformat()
        print(f"    [*] Firing 15 requests to {endpoint2} ...")
        for i in range(15):
            t0 = time.time()
            try:
                r = requests.post(url2, headers=headers, json=body2, timeout=15)
                statuses2.append(r.status_code)
            except Exception:
                statuses2.append(0)
            time.sleep(0.1)

        rate_limited2 = any(s == 429 for s in statuses2)
        finding2 = not rate_limited2
        severity2 = "MEDIUM" if finding2 else "INFO"
        sym2 = "[??]" if finding2 else "[OK]"
        print(f"    [{sym2}] Rate limit /generate-titles: 429s={statuses2.count(429)}  2xx={sum(1 for s in statuses2 if 200<=s<=299)}")
        results.append({
            "endpoint": endpoint2,
            "method": "POST",
            "role": "user",
            "status": statuses2[-1] if statuses2 else 0,
            "expected_status": 429,
            "finding": finding2,
            "severity": severity2,
            "response_time_ms": 0,
            "test_category": "rate_limiting",
            "note": f"Burst 15 reqs. 429s={statuses2.count(429)}, 2xx={sum(1 for s in statuses2 if 200<=s<=299)}. {'No rate limiting detected!' if finding2 else 'Rate limiting active'}",
            "timestamp": ts2
        })

    return results
