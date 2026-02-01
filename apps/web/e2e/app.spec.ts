import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/login');

        await expect(page).toHaveTitle(/Yarn Management/);
        await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
        await page.goto('/login');

        await page.getByRole('button', { name: /sign in/i }).click();

        // Check for validation messages
        await expect(page.getByText(/email.*required/i)).toBeVisible();
    });

    test('should navigate to register page', async ({ page }) => {
        await page.goto('/login');

        await page.getByText(/don't have an account/i).click();

        await expect(page).toHaveURL(/\/register/);
    });
});

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // TODO: Implement actual login
        // For now, navigate directly (assumes auth is handled)
        await page.goto('/');
    });

    test('should display dashboard widgets', async ({ page }) => {
        await expect(page.getByText(/dashboard/i)).toBeVisible();

        // Check for key widgets
        await expect(page.getByText(/production/i)).toBeVisible();
        await expect(page.getByText(/inventory/i)).toBeVisible();
    });

    test('should navigate to different modules', async ({ page }) => {
        // Click on Procurement
        await page.getByRole('link', { name: /procurement/i }).click();
        await expect(page).toHaveURL(/\/procurement/);

        // Click on Manufacturing
        await page.getByRole('link', { name: /manufacturing/i }).click();
        await expect(page).toHaveURL(/\/manufacturing/);
    });
});

test.describe('Responsive Design', () => {
    test('should be mobile responsive', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Check mobile menu
        const menuButton = page.getByRole('button', { name: /menu/i });
        if (await menuButton.isVisible()) {
            await menuButton.click();
            await expect(page.getByRole('navigation')).toBeVisible();
        }
    });
});

test.describe('Search Functionality', () => {
    test('should open global search', async ({ page }) => {
        await page.goto('/');

        // Try keyboard shortcut
        await page.keyboard.press('Control+K');

        await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    });
});
