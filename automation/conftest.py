import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import json
import time

@pytest.fixture(scope="session")
def driver_setup():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(10)
    
    yield driver
    driver.quit()

@pytest.fixture(scope="function")
def driver(driver_setup, request):
    # This fixture allows us to hook into test failures for screenshots
    yield driver_setup
    
    # Check if test failed
    if hasattr(request.node, "rep_call") and request.node.rep_call.failed:
        # Take screenshot
        os.makedirs("Test_Results/Screenshots", exist_ok=True)
        filename = f"Test_Results/Screenshots/{request.node.name}_{int(time.time())}.png"
        driver_setup.save_screenshot(filename)
        
        # Save console logs
        os.makedirs("Test_Results/Logs", exist_ok=True)
        log_filename = f"Test_Results/Logs/{request.node.name}_{int(time.time())}.log"
        with open(log_filename, "w") as f:
            for log in driver_setup.get_log("browser"):
                f.write(f"{log}\n")

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)

def pytest_sessionfinish(session, exitstatus):
    # After tests finish, we will run the report generator script
    pass
