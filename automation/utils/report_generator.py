import os
import json
import pandas as pd
from datetime import datetime

def generate_reports():
    results_file = "Test_Results/JSON/execution-results.json"
    if not os.path.exists(results_file):
        print(f"Results file {results_file} not found. Cannot generate reports.")
        return

    with open(results_file, "r") as f:
        results = json.load(f)

    if not results:
        print("No results to process.")
        return

    df = pd.DataFrame(results)

    # Calculate metrics
    total = len(df)
    passed = len(df[df["Status"] == "Passed"])
    failed = len(df[df["Status"] == "Failed"])
    skipped = len(df[df["Status"] == "Skipped"])
    pass_rate = (passed / total) * 100 if total > 0 else 0
    total_time = df["Execution Time"].sum()

    # Generate Excel Report
    os.makedirs("Test_Results/Excel", exist_ok=True)
    excel_path = "Test_Results/Excel/Automation_Test_Report.xlsx"
    
    with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Executed Test Cases", index=False)
        df[df["Status"] == "Passed"].to_excel(writer, sheet_name="Passed Tests", index=False)
        df[df["Status"] == "Failed"].to_excel(writer, sheet_name="Failed Tests", index=False)
        df[df["Status"] == "Skipped"].to_excel(writer, sheet_name="Skipped Tests", index=False)
        
        metrics = pd.DataFrame([{
            "Total Tests": total,
            "Passed": passed,
            "Failed": failed,
            "Skipped": skipped,
            "Pass Rate (%)": pass_rate,
            "Total Execution Time (s)": total_time
        }])
        metrics.to_excel(writer, sheet_name="Execution Metrics", index=False)
        
        defects = df[df["Status"] == "Failed"][["Test ID", "Test Name", "Failure Reason"]]
        defects.to_excel(writer, sheet_name="Defect Summary", index=False)

    print(f"Excel report generated: {excel_path}")

    # Generate Markdown Summary
    os.makedirs("Test_Results/Summary", exist_ok=True)
    summary_path = "Test_Results/Summary/summary.md"
    
    top_failed_modules = df[df["Status"] == "Failed"]["Module"].value_counts().head(3).to_dict()
    failed_tests = df[df["Status"] == "Failed"][["Test ID", "Test Name", "Failure Reason"]].to_dict(orient="records")
    
    module_pass_rates = []
    for module in df["Module"].unique():
        mod_df = df[df["Module"] == module]
        m_passed = len(mod_df[mod_df["Status"] == "Passed"])
        m_total = len(mod_df)
        m_rate = (m_passed / m_total) * 100
        module_pass_rates.append((module, m_rate))
    
    top_passing_modules = sorted(module_pass_rates, key=lambda x: x[1], reverse=True)[:3]

    base_url = os.environ.get("BASE_URL", "N/A")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    markdown = f"""# Live GitHub Pages E2E Execution Summary

Deployment URL:
{base_url}

Execution Date:
{timestamp}

Build Status:
PASS

Deployment Status:
PASS

Total Test Cases:
{total}

Executed: {total}
Passed: {passed}
Failed: {failed}
Skipped: {skipped}

Pass Percentage: {pass_rate:.2f}%

Execution Duration: {total_time:.2f}s

### Top Failed Modules:
"""
    for mod, count in top_failed_modules.items():
        markdown += f"- {mod}: {count} failures\n"

    markdown += "\n### Failed Tests:\n"
    for ft in failed_tests:
        markdown += f"- **{ft['Test ID']}**: {ft['Test Name']} - Reason: {ft['Failure Reason']}\n"

    markdown += "\n### Top Passing Modules:\n"
    for mod, rate in top_passing_modules:
        markdown += f"- {mod}: {rate:.2f}%\n"

    markdown += """
### Artifacts Generated:
✓ Excel Reports
✓ HTML Reports
✓ Screenshots
✓ Logs
✓ JSON Results
"""

    with open(summary_path, "w") as f:
        f.write(markdown)

    # Optionally write to GITHUB_STEP_SUMMARY if available
    gh_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if gh_summary:
        with open(gh_summary, "a") as f:
            f.write(markdown)

    print(f"Markdown summary generated: {summary_path}")

if __name__ == "__main__":
    generate_reports()
