import pytest
import pandas as pd
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options

# Store test results
_test_results = []

@pytest.fixture(scope="session")
def driver():
    """Setup and teardown of the Selenium WebDriver."""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    
    # Initialize the Chrome driver (assumes chromedriver is installed or managed)
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(10)
    driver.maximize_window()
    
    yield driver
    
    driver.quit()

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook to capture test execution status and metadata."""
    outcome = yield
    report = outcome.get_result()

    if report.when == "call":
        _test_results.append({
            "Test Name": item.name,
            "Node ID": item.nodeid,
            "Duration (s)": round(report.duration, 2),
            "Outcome": report.outcome.upper(),
            "Error Details": str(report.longrepr) if report.failed else ""
        })

def pytest_sessionfinish(session, exitstatus):
    """Hook to generate the Excel report upon test session completion."""
    if _test_results:
        df = pd.DataFrame(_test_results)
        
        # Format duration to numeric
        df["Duration (s)"] = pd.to_numeric(df["Duration (s)"])
        
        report_path = os.path.join(os.path.dirname(__file__), "web_test_report.xlsx")
        
        try:
            # Create Excel writer and save
            with pd.ExcelWriter(report_path, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name="Web E2E Results")
            print(f"\n[E2E Tests] Excel report successfully generated: {report_path}")
        except Exception as e:
            print(f"\n[E2E Tests] Failed to generate Excel report: {e}")
