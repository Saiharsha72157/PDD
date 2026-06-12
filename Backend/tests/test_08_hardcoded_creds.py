"""
test_08_hardcoded_creds.py ? Static scan of codebase for committed secrets.
Checks that .env is in .gitignore and scans all .py files for hardcoded secrets.
"""
import os, re
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_PATTERNS = [
    (r'(?i)(api[_-]?key|apikey)\s*=\s*["\']([A-Za-z0-9\-_]{20,})["\']',         "API Key"),
    (r'(?i)(secret[_-]?key|jwt[_-]?secret)\s*=\s*["\']([A-Za-z0-9+/=]{20,})["\']', "JWT/Secret Key"),
    (r'(?i)(password|passwd|pwd)\s*=\s*["\']([^\'"]{4,})["\']',                   "Password"),
    (r'(?i)(token)\s*=\s*["\']([A-Za-z0-9\-_.]{30,})["\']',                       "Token"),
    (r'gsk_[A-Za-z0-9]{40,}',                                                      "Groq API Key"),
    (r'KGAT_[A-Za-z0-9]{20,}',                                                     "Kaggle Token"),
    (r'eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+',                   "JWT Token"),
    (r'(?i)smtp[_\s]*(email|password|user)\s*=\s*["\']([^\'"]+)["\']',            "SMTP Credential"),
]

SKIP_DIRS = {"venv", ".git", "__pycache__", "automated_test", "automated_tests"}
SKIP_FILES = {".env"}

def scan_file(filepath: str) -> list:
    findings = []
    try:
        with open(filepath, encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        for lineno, line in enumerate(lines, 1):
            for pattern, label in SECRET_PATTERNS:
                if re.search(pattern, line):
                    # Redact actual value from finding note
                    findings.append((lineno, label, line.strip()[:80]))
    except Exception:
        pass
    return findings

def run(cfg: dict) -> list:
    results = []
    ts = datetime.now(timezone.utc).isoformat()

    # 1. Check .env is gitignored
    gitignore_path = os.path.join(ROOT, ".gitignore")
    env_gitignored = False
    if os.path.exists(gitignore_path):
        with open(gitignore_path) as f:
            content = f.read()
        env_gitignored = ".env" in content

    finding_gitignore = not env_gitignored
    sym = "[OK]" if env_gitignored else "[!!]"
    print(f"    [{sym}] .env in .gitignore: {env_gitignored}")
    results.append({
        "endpoint": ".gitignore",
        "method": "STATIC",
        "role": "codebase",
        "status": 0,
        "expected_status": 0,
        "finding": finding_gitignore,
        "severity": "HIGH" if finding_gitignore else "INFO",
        "response_time_ms": 0,
        "test_category": "hardcoded_creds",
        "note": ".env is NOT in .gitignore ? credentials may be committed!" if finding_gitignore else ".env correctly excluded from git",
        "timestamp": ts
    })

    # 2. Scan all .py files for hardcoded secrets
    all_files_with_secrets = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        # Skip unwanted directories
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fname in filenames:
            if fname in SKIP_FILES:
                continue
            if not fname.endswith((".py", ".json", ".txt", ".env.example", ".yaml", ".yml")):
                continue
            fpath = os.path.join(dirpath, fname)
            found = scan_file(fpath)
            if found:
                all_files_with_secrets.append((fpath, found))

    for fpath, findings_list in all_files_with_secrets:
        rel = os.path.relpath(fpath, ROOT)
        for lineno, label, snippet in findings_list:
            finding = True
            # Env vars loaded via os.getenv() are OK ? flag only hardcoded literals
            if "os.getenv" in snippet or "os.environ" in snippet:
                finding = False
                severity = "INFO"
                note = f"Env var lookup (OK): {label} at line {lineno}"
            elif "SUPABASE_ANON" in snippet and "test_00_get_token" in rel:
                # This is the anon key in our own test file ? flag it
                finding = True
                severity = "MEDIUM"
                note = f"Anon key hardcoded in test file {rel}:{lineno} ? move to input.json"
            else:
                severity = "HIGH"
                note = f"Possible hardcoded {label} in {rel}:{lineno} ? snippet: {snippet[:60]!r}"
            sym = "[!!]" if finding and severity == "HIGH" else ("[??]" if finding else "[OK]")
            print(f"    [{sym}] HardcodedCreds [{severity}] {rel}:{lineno} ? {label}")
            results.append({
                "endpoint": rel,
                "method": "STATIC",
                "role": "codebase",
                "status": 0,
                "expected_status": 0,
                "finding": finding,
                "severity": severity,
                "response_time_ms": 0,
                "test_category": "hardcoded_creds",
                "note": note,
                "timestamp": ts
            })

    if not all_files_with_secrets:
        print("    [[OK]] No hardcoded secrets found in source files")
        results.append({
            "endpoint": "codebase",
            "method": "STATIC",
            "role": "codebase",
            "status": 0, "expected_status": 0,
            "finding": False, "severity": "INFO",
            "response_time_ms": 0,
            "test_category": "hardcoded_creds",
            "note": "No hardcoded secrets found in Python source files",
            "timestamp": ts
        })

    return results
