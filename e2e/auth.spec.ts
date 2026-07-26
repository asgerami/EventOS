import { test, expect } from '@playwright/test';

test.describe('Authentication & Navigation', () => {
  test('should render sign-in page correctly', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('h1, h2, h3')).toContainText(/sign in/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });

  test('should navigate to sign-up page', async ({ page }) => {
    await page.goto('/sign-in');
    await page.click('a[href="/sign-up"]');
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('should navigate to forgot-password page', async ({ page }) => {
    await page.goto('/sign-in');
    await page.click('a[href="/forgot-password"]');
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
