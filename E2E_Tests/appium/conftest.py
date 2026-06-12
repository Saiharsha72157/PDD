import pytest
import pandas as pd
import os
from appium import webdriver
from appium.options.android import UiAutomator2Options

# Store test results
_test_results = []


@pytest.fixture(scope="session")
def driver():
    """
    Setup and teardown of the Appium WebDriver for Android.
    """

    options = UiAutomator2Options()

    # Android Configuration
    options.platform_name = "Android"
    options.automation_name = "UiAutomator2"

    # Connected Physical Device
    options.set_capability("udid", "3C159W0014T00000")

    # Expo Go
    options.set_capability("appPackage", "host.exp.exponent")
    options.set_capability(
        "appActivity",
        "host.exp.exponent.experience.HomeActivity"
    )

    # Keep existing app state
    options.set_capability("noReset", True)

    # Permissions
    options.set_capability("autoGrantPermissions", True)

    # Stability
    options.set_capability("newCommandTimeout", 300)

    # VERY IMPORTANT FIXES
    options.set_capability("skipServerInstallation", True)
    options.set_capability("uiautomator2ServerInstallTimeout", 180000)
    options.set_capability("adbExecTimeout", 180000)
    options.set_capability("androidInstallTimeout", 180000)

    print("\n====================================")
    print("Starting Appium Driver")
    print("Device UDID : 3C159W0014T00000")
    print("Package     : host.exp.exponent")
    print("Activity    : host.exp.exponent.experience.HomeActivity")
    print("====================================\n")

    driver = webdriver.Remote(
        "http://127.0.0.1:4723",
        options=options
    )

    driver.implicitly_wait(10)

    yield driver

    print("\nClosing Appium Driver...\n")
    driver.quit()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Capture test execution status and metadata.
    """
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
    """
    Generate Excel report after execution.
    """

    if not _test_results:
        return

    df = pd.DataFrame(_test_results)

    report_path = os.path.join(
        os.path.dirname(__file__),
        "mobile_test_report.xlsx"
    )

    try:
        with pd.ExcelWriter(
            report_path,
            engine="openpyxl"
        ) as writer:

            df.to_excel(
                writer,
                sheet_name="Mobile E2E Results",
                index=False
            )

        print(
            f"\n[E2E Tests] Excel report generated:\n{report_path}\n"
        )

    except Exception as e:
        print(
            f"\n[E2E Tests] Failed to generate report:\n{e}\n"
        )