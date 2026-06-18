"""
load_test.py — Baseline / Load Testing Engine for ResearchMateAI Backend

Simulates 100 concurrent virtual users continuously sending HTTP requests
to the API for 60 seconds and collects detailed performance metrics.

Usage:
    from load_test import run_load_test
    results = run_load_test(base_url="http://127.0.0.1:9000", num_users=100, duration_seconds=60)
"""

import os
import sys
import json
import time
import random
import threading
import statistics
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# ── Token acquisition (reuse existing pattern) ──────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(SCRIPT_DIR, "_token.json")

# Add parent directory for dotenv access
sys.path.insert(0, os.path.join(SCRIPT_DIR, ".."))
from dotenv import load_dotenv
load_dotenv(os.path.join(SCRIPT_DIR, "..", ".env"))

SUPABASE_URL  = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON = os.environ.get("SUPABASE_ANON", "")


def acquire_token(email: str, password: str) -> str:
    """Obtain a Supabase JWT token for authenticated endpoint testing."""
    try:
        resp = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                "apikey": SUPABASE_ANON,
                "Content-Type": "application/json",
            },
            json={"email": email, "password": password},
            timeout=15,
        )
        if resp.status_code == 200:
            token = resp.json().get("access_token", "")
            if token:
                with open(TOKEN_FILE, "w") as f:
                    json.dump({"token": token, "email": email}, f)
                return token
    except Exception as e:
        print(f"[LoadTest] Token acquisition failed: {e}")
    
    # Fallback: read from existing token file
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE) as f:
            return json.load(f).get("token", "")
    return ""

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
]

# ── Endpoint definitions ─────────────────────────────────────────────────────
def get_endpoints(base_url: str) -> List[Dict[str, Any]]:
    """Define the API endpoints to test in round-robin."""
    return [
        {
            "name": "GET /health",
            "method": "GET",
            "url": f"{base_url}/health",
            "auth_required": False,
            "body": None,
        },
        {
            "name": "GET /",
            "method": "GET",
            "url": f"{base_url}/",
            "auth_required": False,
            "body": None,
        },
        {
            "name": "POST /paraphrase",
            "method": "POST",
            "url": f"{base_url}/paraphrase",
            "auth_required": False,
            "body": {
                "text": "Artificial intelligence is transforming how we approach scientific research and data analysis.",
                "mode": "standard",
                "language": "English",
            },
        },
        {
            "name": "POST /writing-analysis",
            "method": "POST",
            "url": f"{base_url}/writing-analysis",
            "auth_required": False,
            "body": {
                "text": "The rapid advancement of machine learning techniques has significantly impacted various domains including healthcare and finance.",
            },
        },
        {
            "name": "POST /generate-titles",
            "method": "POST",
            "url": f"{base_url}/generate-titles",
            "auth_required": True,
            "body": {
                "department": "Computer Science",
                "domain": "Artificial Intelligence",
            },
        },
    ]


# ── Single request executor ──────────────────────────────────────────────────
def send_request(
    endpoint: Dict[str, Any],
    token: str,
    timeout: float = 120.0,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> Dict[str, Any]:
    """Send a single HTTP request and record the result."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if ip_address:
        headers["X-Forwarded-For"] = ip_address
    if user_agent:
        headers["User-Agent"] = user_agent

    start_time = time.perf_counter()
    timestamp = datetime.now(timezone.utc).isoformat()

    try:
        if endpoint["method"] == "GET":
            resp = requests.get(
                endpoint["url"], headers=headers, timeout=timeout
            )
        else:
            resp = requests.post(
                endpoint["url"],
                headers=headers,
                json=endpoint["body"],
                timeout=timeout,
            )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "timestamp": timestamp,
            "endpoint": endpoint["name"],
            "method": endpoint["method"],
            "url": endpoint["url"],
            "status_code": resp.status_code,
            "response_time_ms": elapsed_ms,
            "success": 200 <= resp.status_code < 300,
            "rate_limited": resp.status_code == 429,
            "error": None,
        }
    except requests.exceptions.Timeout:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "timestamp": timestamp,
            "endpoint": endpoint["name"],
            "method": endpoint["method"],
            "url": endpoint["url"],
            "status_code": 0,
            "response_time_ms": elapsed_ms,
            "success": False,
            "rate_limited": False,
            "error": "TIMEOUT",
        }
    except requests.exceptions.ConnectionError:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "timestamp": timestamp,
            "endpoint": endpoint["name"],
            "method": endpoint["method"],
            "url": endpoint["url"],
            "status_code": 0,
            "response_time_ms": elapsed_ms,
            "success": False,
            "rate_limited": False,
            "error": "CONNECTION_ERROR",
        }
    except Exception as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "timestamp": timestamp,
            "endpoint": endpoint["name"],
            "method": endpoint["method"],
            "url": endpoint["url"],
            "status_code": 0,
            "response_time_ms": elapsed_ms,
            "success": False,
            "rate_limited": False,
            "error": str(e),
        }


# ── Virtual user worker ──────────────────────────────────────────────────────
def virtual_user_worker(
    user_id: int,
    endpoints: List[Dict[str, Any]],
    token: str,
    duration_seconds: int,
    results_list: list,
    results_lock: threading.Lock,
    stop_event: threading.Event,
):
    """
    Simulates a single virtual user sending requests in round-robin
    until the duration expires or the stop event is set.
    """
    endpoint_index = user_id % len(endpoints)  # Stagger starting endpoint
    start_time = time.time()
    
    # Assign unique attributes for this virtual user to prevent rate limiting
    ip_address = f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"
    user_agent = random.choice(USER_AGENTS)

    while not stop_event.is_set() and (time.time() - start_time) < duration_seconds:
        endpoint = endpoints[endpoint_index % len(endpoints)]
        result = send_request(endpoint, token, ip_address=ip_address, user_agent=user_agent)
        result["user_id"] = user_id

        with results_lock:
            results_list.append(result)

        endpoint_index += 1
        
        # Realistic pacing (simulate human think time)
        time.sleep(random.uniform(0.5, 1.5))


# ── Metrics computation ──────────────────────────────────────────────────────
def compute_metrics(
    results: List[Dict[str, Any]],
    duration_seconds: int,
    num_users: int,
) -> Dict[str, Any]:
    """Compute aggregate performance metrics from raw results."""
    if not results:
        return {"error": "No results collected"}

    response_times = [r["response_time_ms"] for r in results]
    successful = [r for r in results if r["success"]]
    errors = [r for r in results if not r["success"]]
    rate_limited = [r for r in results if r["rate_limited"]]

    sorted_times = sorted(response_times)
    n = len(sorted_times)

    def percentile(data: list, pct: float) -> float:
        idx = int(len(data) * pct / 100)
        idx = min(idx, len(data) - 1)
        return data[idx]

    # Per-endpoint breakdown
    endpoint_metrics = {}
    endpoints_seen = set(r["endpoint"] for r in results)
    for ep_name in endpoints_seen:
        ep_results = [r for r in results if r["endpoint"] == ep_name]
        ep_times = [r["response_time_ms"] for r in ep_results]
        ep_sorted = sorted(ep_times)
        ep_success = [r for r in ep_results if r["success"]]
        ep_errors = [r for r in ep_results if not r["success"]]
        ep_rate_limited = [r for r in ep_results if r["rate_limited"]]

        endpoint_metrics[ep_name] = {
            "total_requests": len(ep_results),
            "successful": len(ep_success),
            "errors": len(ep_errors),
            "rate_limited": len(ep_rate_limited),
            "rps": round(len(ep_results) / duration_seconds, 2),
            "avg_ms": round(statistics.mean(ep_times), 2),
            "min_ms": round(min(ep_times), 2),
            "max_ms": round(max(ep_times), 2),
            "p50_ms": round(percentile(ep_sorted, 50), 2),
            "p95_ms": round(percentile(ep_sorted, 95), 2),
            "p99_ms": round(percentile(ep_sorted, 99), 2),
        }

    # Timeline (second-by-second)
    timeline = []
    if results:
        # Group by relative second
        test_start = min(
            datetime.fromisoformat(r["timestamp"]) for r in results
        )
        for r in results:
            r["_relative_second"] = int(
                (datetime.fromisoformat(r["timestamp"]) - test_start).total_seconds()
            )

        for sec in range(duration_seconds + 1):
            sec_results = [r for r in results if r.get("_relative_second") == sec]
            if sec_results:
                sec_times = [r["response_time_ms"] for r in sec_results]
                timeline.append({
                    "second": sec,
                    "requests": len(sec_results),
                    "avg_response_ms": round(statistics.mean(sec_times), 2),
                    "success": sum(1 for r in sec_results if r["success"]),
                    "errors": sum(1 for r in sec_results if not r["success"]),
                })

    return {
        "test_config": {
            "num_users": num_users,
            "duration_seconds": duration_seconds,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "summary": {
            "total_requests": len(results),
            "successful_requests": len(successful),
            "error_requests": len(errors),
            "rate_limited_requests": len(rate_limited),
            "success_rate_pct": round(len(successful) / len(results) * 100, 2),
            "rps": round(len(results) / duration_seconds, 2),
            "avg_ms": round(statistics.mean(response_times), 2),
            "min_ms": round(min(response_times), 2),
            "max_ms": round(max(response_times), 2),
            "median_ms": round(statistics.median(response_times), 2),
            "p50_ms": round(percentile(sorted_times, 50), 2),
            "p95_ms": round(percentile(sorted_times, 95), 2),
            "p99_ms": round(percentile(sorted_times, 99), 2),
            "std_dev_ms": round(statistics.stdev(response_times), 2) if len(response_times) > 1 else 0,
        },
        "per_endpoint": endpoint_metrics,
        "timeline": timeline,
        "raw_results": results,
    }


# ── Main runner ──────────────────────────────────────────────────────────────
def run_load_test(
    base_url: str = "http://127.0.0.1:9000",
    num_users: int = 100,
    duration_seconds: int = 60,
    token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Execute the baseline load test.

    Args:
        base_url: The API base URL to test against.
        num_users: Number of concurrent virtual users (threads).
        duration_seconds: How long to run the test in seconds.
        token: Optional pre-acquired JWT token. If None, will attempt to acquire.

    Returns:
        A dictionary containing all metrics, per-endpoint breakdown, timeline, and raw results.
    """
    print("=" * 70)
    print("  BASELINE LOAD TEST — ResearchMateAI Backend")
    print("=" * 70)
    print(f"  Target URL     : {base_url}")
    print(f"  Virtual Users  : {num_users}")
    print(f"  Duration       : {duration_seconds} seconds")
    print(f"  Start Time     : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # Acquire token if not provided
    if not token:
        print("\n[1/4] Acquiring authentication token...")
        input_path = os.path.join(SCRIPT_DIR, "input.json")
        if os.path.exists(input_path):
            with open(input_path) as f:
                cfg = json.load(f)
            token = acquire_token(cfg.get("email", ""), cfg.get("password", ""))
            if token:
                print(f"       Token acquired (length={len(token)})")
            else:
                print("       WARNING: No token acquired. Authenticated endpoints may fail.")
        else:
            print("       WARNING: input.json not found. Skipping token acquisition.")
    else:
        print("\n[1/4] Using provided token.")

    # Prepare endpoints
    print("[2/4] Preparing endpoint definitions...")
    endpoints = get_endpoints(base_url)
    for ep in endpoints:
        print(f"       {ep['method']:4s} {ep['name']}")

    # Quick connectivity check
    print("[3/4] Verifying server connectivity...")
    try:
        check = requests.get(f"{base_url}/health", timeout=15)
        if check.status_code == 200:
            print(f"       Server is UP (status={check.status_code})")
        else:
            print(f"       WARNING: Server returned status={check.status_code}")
    except Exception as e:
        print(f"       ERROR: Cannot reach server at {base_url}: {e}")
        print("       Make sure the backend server is running!")
        return {"error": f"Server unreachable: {e}"}

    # Run load test
    print(f"[4/4] Launching {num_users} virtual users for {duration_seconds}s...")
    print()

    results_list: list = []
    results_lock = threading.Lock()
    stop_event = threading.Event()

    progress_start = time.time()

    def print_progress():
        """Print live progress every 5 seconds."""
        while not stop_event.is_set():
            time.sleep(5)
            elapsed = int(time.time() - progress_start)
            with results_lock:
                count = len(results_list)
            if not stop_event.is_set():
                rps = count / max(elapsed, 1)
                print(f"       [{elapsed:3d}s] {count} requests sent ({rps:.1f} req/s)")

    progress_thread = threading.Thread(target=print_progress, daemon=True)
    progress_thread.start()

    threads = []
    for user_id in range(num_users):
        t = threading.Thread(
            target=virtual_user_worker,
            args=(user_id, endpoints, token, duration_seconds, results_list, results_lock, stop_event),
            daemon=True,
        )
        threads.append(t)
        t.start()

    # Wait for duration
    time.sleep(duration_seconds)
    stop_event.set()

    # Wait for all threads to finish
    for t in threads:
        t.join(timeout=5)

    print(f"\n       Done! Collected {len(results_list)} request records.")

    # Compute metrics
    print("\n[*] Computing performance metrics...")
    metrics = compute_metrics(results_list, duration_seconds, num_users)

    # Fetch Server-side Dashboard Metrics
    print("\n[*] Fetching server-side API Key Dashboard Metrics...")
    try:
        dash_resp = requests.get(f"{base_url}/dashboard/metrics", timeout=10)
        if dash_resp.status_code == 200:
            metrics["dashboard"] = dash_resp.json()
            print("       Success: Fetched server-side metrics.")
        else:
            print(f"       WARNING: /dashboard/metrics returned {dash_resp.status_code}")
    except Exception as e:
        print(f"       WARNING: Could not fetch dashboard metrics: {e}")

    # Save raw results to JSON
    report_json_path = os.path.join(SCRIPT_DIR, "load_test_results.json")
    with open(report_json_path, "w") as f:
        # Don't save raw results to JSON (too large), just metrics
        save_data = {k: v for k, v in metrics.items() if k != "raw_results"}
        save_data["raw_results_count"] = len(metrics.get("raw_results", []))
        json.dump(save_data, f, indent=2, default=str)
    print(f"[*] Results JSON saved -> {report_json_path}")

    return metrics


# ── CLI entry point ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ResearchMateAI Baseline Load Test")
    parser.add_argument("--url", default="http://127.0.0.1:9000", help="Base URL of the API")
    parser.add_argument("--users", type=int, default=100, help="Number of virtual users")
    parser.add_argument("--duration", type=int, default=60, help="Test duration in seconds")
    args = parser.parse_args()

    metrics = run_load_test(
        base_url=args.url,
        num_users=args.users,
        duration_seconds=args.duration,
    )

    if "error" not in metrics:
        s = metrics["summary"]
        print("\n" + "=" * 70)
        print("  RESULTS")
        print("=" * 70)
        print(f"  Requests per second (RPS) : {s['rps']} req/sec")
        print(f"  Total Requests            : {s['total_requests']}")
        print(f"  Successful                : {s['successful_requests']}")
        print(f"  Errors                    : {s['error_requests']}")
        print(f"  Rate Limited (429)        : {s['rate_limited_requests']}")
        print(f"  Success Rate              : {s['success_rate_pct']}%")
        print()
        print(f"  Response Time:")
        print(f"    Average : {s['avg_ms']}ms")
        print(f"    Min     : {s['min_ms']}ms")
        print(f"    Max     : {s['max_ms']}ms")
        print(f"    p50     : {s['p50_ms']}ms")
        print(f"    p95     : {s['p95_ms']}ms")
        print(f"    p99     : {s['p99_ms']}ms")
        print("=" * 70)
