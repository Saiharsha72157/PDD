"""
run_load_test.py — One-Click Load Test Orchestrator

Runs the baseline load test (100 users × 60 seconds) and generates the Excel report.

Usage:
    python run_load_test.py
    python run_load_test.py --url http://127.0.0.1:9000 --users 100 --duration 60
"""

import os
import sys
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from load_test import run_load_test
from generate_load_report import generate_report


def main():
    parser = argparse.ArgumentParser(
        description="ResearchMateAI — Baseline Load Test Runner + Excel Report"
    )
    parser.add_argument(
        "--url",
        default="http://127.0.0.1:9000",
        help="Base URL of the API server (default: http://127.0.0.1:9000)",
    )
    parser.add_argument(
        "--users",
        type=int,
        default=100,
        help="Number of concurrent virtual users (default: 100)",
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=60,
        help="Test duration in seconds (default: 60)",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output path for Excel report (default: Load_Test_Report.xlsx)",
    )
    args = parser.parse_args()

    # ── Phase 1: Run Load Test ────────────────────────────────────────────
    metrics = run_load_test(
        base_url=args.url,
        num_users=args.users,
        duration_seconds=args.duration,
    )

    if "error" in metrics:
        print(f"\n[FAILED] Load test could not complete: {metrics['error']}")
        sys.exit(1)

    # ── Phase 2: Print CLI Summary ────────────────────────────────────────
    s = metrics["summary"]

    print()
    print("+" + "=" * 68 + "+")
    print("|" + "  BASELINE LOAD TEST -- FINAL RESULTS".center(68) + "|")
    print("+" + "=" * 68 + "+")
    print("|" + f"  Requests per second (RPS) : {s['rps']} req/sec".ljust(68) + "|")
    print("|" + "".ljust(68) + "|")
    print("|" + f"  Response Time:".ljust(68) + "|")
    print("|" + f"    Average : {s['avg_ms']}ms".ljust(68) + "|")
    print("|" + f"    Min     : {s['min_ms']}ms".ljust(68) + "|")
    print("|" + f"    Max     : {s['max_ms']}ms".ljust(68) + "|")
    print("|" + f"    p50     : {s['p50_ms']}ms".ljust(68) + "|")
    print("|" + f"    p95     : {s['p95_ms']}ms".ljust(68) + "|")
    print("|" + f"    p99     : {s['p99_ms']}ms".ljust(68) + "|")
    print("|" + "".ljust(68) + "|")
    print("|" + f"  Total Requests   : {s['total_requests']}".ljust(68) + "|")
    print("|" + f"  Successful       : {s['successful_requests']}".ljust(68) + "|")
    print("|" + f"  Errors           : {s['error_requests']}".ljust(68) + "|")
    print("|" + f"  Rate Limited     : {s['rate_limited_requests']}".ljust(68) + "|")
    print("|" + f"  Success Rate     : {s['success_rate_pct']}%".ljust(68) + "|")
    print("+" + "=" * 68 + "+")

    # Per-endpoint mini-summary
    print("|" + "  PER-ENDPOINT BREAKDOWN:".ljust(68) + "|")
    print("|" + "".ljust(68) + "|")
    for ep_name, ep_data in sorted(metrics.get("per_endpoint", {}).items()):
        line1 = f"  {ep_name}"
        line2 = f"    RPS: {ep_data['rps']}  |  Avg: {ep_data['avg_ms']}ms  |  Min: {ep_data['min_ms']}ms  |  Max: {ep_data['max_ms']}ms"
        line3 = f"    Total: {ep_data['total_requests']}  |  OK: {ep_data['successful']}  |  Err: {ep_data['errors']}  |  429: {ep_data['rate_limited']}"
        print("|" + line1.ljust(68) + "|")
        print("|" + line2.ljust(68) + "|")
        print("|" + line3.ljust(68) + "|")
        print("|" + "".ljust(68) + "|")

    print("+" + "=" * 68 + "+")

    # ── Phase 3: Generate Excel Report ────────────────────────────────────
    report_path = generate_report(metrics, output_path=args.output)

    print()
    print(f"[OK] Load test complete!")
    print(f"[REPORT] Excel report: {report_path}")
    print()


if __name__ == "__main__":
    main()
