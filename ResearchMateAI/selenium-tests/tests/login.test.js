const { Builder, By, until } = require('selenium-webdriver');

describe('Frontend Login Functionality', () => {
    let driver;

    // Set a longer timeout for Selenium tests
    jest.setTimeout(30000);

    beforeAll(async () => {
        // Initialize the Chrome driver
        driver = await new Builder().forBrowser('chrome').build();
    });

    afterAll(async () => {
        // Quit the driver after all tests are done
        if (driver) {
            await driver.quit();
        }
    });

    it('should navigate to login page and login successfully', async () => {
        // Navigate to the app's login page
        // TODO: Update the URL to match your actual local development URL
        await driver.get('http://localhost:3000/login');

        // Find the email input and enter the test email
        // Note: Update selectors based on your actual UI implementation
        const emailInput = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 5000);
        await emailInput.sendKeys('testuser@example.com');

        // Find the password input and enter the password
        const passwordInput = await driver.wait(until.elementLocated(By.css('input[type="password"]')), 5000);
        await passwordInput.sendKeys('password123');

        // Find the submit button and click it
        const loginButton = await driver.findElement(By.css('button[type="submit"]'));
        await loginButton.click();

        // Wait for the URL to change indicating a successful redirect
        // TODO: Update the expected path
        await driver.wait(until.urlContains('/dashboard'), 5000);
        
        // Assert we successfully navigated
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toContain('/dashboard');
    });

    it('should show an error message on invalid credentials', async () => {
        await driver.get('http://localhost:3000/login');

        const emailInput = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 5000);
        await emailInput.sendKeys('wrong@example.com');

        const passwordInput = await driver.wait(until.elementLocated(By.css('input[type="password"]')), 5000);
        await passwordInput.sendKeys('wrongpass');

        const loginButton = await driver.findElement(By.css('button[type="submit"]'));
        await loginButton.click();

        // Wait for an error message to appear
        // TODO: Update the class name to match your error UI component
        const errorMessage = await driver.wait(until.elementLocated(By.css('.error-message')), 5000);
        const text = await errorMessage.getText();
        
        // Verify the error text is present
        expect(text.length).toBeGreaterThan(0);
    });
});
