"""
DAST Runner ? ResearchMateAI Backend
Orchestrates all security test categories and writes savepoint + final report.
"""

import json
import os
import sys
import time
import subprocess
import importlib.util
from datetime import datetime, timezone

# -- Config -----------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.dirname(SCRIPT_DIR)
INPUT_JSON = os.path.join(ROOT_DIR, "automated_tests", "input.json")
REPORT_PATH     = os.path.join(SCRIPT_DIR, "report.json")
SAVEPOINT_PATH  = os.path.join(SCRIPT_DIR, "savepoint.json")

def load_config():
    with open(INPUT_JSON) as f:
        cfg = json.load(f)
    # baseUrl is now hard-coded since input.json only has creds
    cfg.setdefault("baseUrl", "http://127.0.0.1:8000")
    return cfg

# -- Helpers -----------------------------------------------------------------
def run_test_module(module_file: str, cfg: dict) -> list:
    spec = importlib.util.spec_from_file_location("test_module", module_file)
    if spec is None or spec.loader is None:
        return []
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.run(cfg)

def save_savepoint(results: list):
    with open(SAVEPOINT_PATH, "w") as f:
        json.dump(results, f, indent=2)

def write_report(results: list):
    with open(REPORT_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n[[OK]] Report written -> {REPORT_PATH}")

def print_summary(results: list):
    total    = len(results)
    findings = [r for r in results if r.get("finding")]
    by_sev   = {}
    for r in findings:
        s = r.get("severity", "INFO")
        by_sev.setdefault(s, []).append(r)

    print("\n" + "?"*60)
    print("  DAST SUMMARY ? ResearchMateAI Backend")
    print("?"*60)
    print(f"  Tests run  : {total}")
    print(f"  Findings   : {len(findings)}")
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]:
        items = by_sev.get(sev, [])
        if items:
            sym = {"CRITICAL":"[!!]","HIGH":"[!!]","MEDIUM":"[??]","LOW":"[??]","INFO":"[OK]"}.get(sev,"?")
            print(f"  {sym} {sev:8s}: {len(items)}")

    if findings:
        print("\n  TOP FINDINGS:")
        for r in sorted(findings, key=lambda x: ["CRITICAL","HIGH","MEDIUM","LOW","INFO"].index(x.get("severity","INFO"))):
            print(f"    [{r['severity']:8s}] {r['method']} {r['endpoint']}  ? {r['note']}")
    print("?"*60 + "\n")

# -- Main ---------------------------------------------------------------------
if __name__ == "__main__":
    cfg = load_config()
    print(f"[*] Base URL  : {cfg['baseUrl']}")
    print(f"[*] Test dir  : {SCRIPT_DIR}")

    test_files = [
        "test_00_get_token.py",
        "test_01_authn_bypass.py",
        "test_02_authz_privesc.py",
        "test_03_idor.py",
        "test_04_rbac_matrix.py",
        "test_05_token_tampering.py",
        "test_06_injection.py",
        "test_07_rate_limit.py",
        "test_08_hardcoded_creds.py",
    ]

    all_results = []
    for tf in test_files:
        path = os.path.join(SCRIPT_DIR, tf)
        if not os.path.exists(path):
            print(f"[!] Missing test file: {tf} ? skipping")
            continue
        print(f"\n[*] Running {tf} ...")
        try:
            results = run_test_module(path, cfg)
            all_results.extend(results)
            save_savepoint(all_results)
            found = sum(1 for r in results if r.get("finding"))
            print(f"    -> {len(results)} tests, {found} findings")
        except Exception as e:
            print(f"[!] Error in {tf}: {e}")

    write_report(all_results)
    print_summary(all_results)
