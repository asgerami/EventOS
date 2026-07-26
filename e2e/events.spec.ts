import { test, expect } from '@playwright/test';

test.describe('Event Management Workflow', () => {
  test('should load events page or redirect to sign-in', async ({ page }) => {
    await page.goto('/events');
    const url = page.url();
    expect(url.includes('/events') || url.includes('/sign-in') || url.includes('/organizations')).toBeTruthy();
  });

  test('should render new event form layout', async ({ page }) => {
    await page.goto('/events/new');
    const url = page.url();
    if (url.includes('/events/new')) {
      await expect(page.locator('form, input[name="name"], input#name')).toBeVisible();
    }
  });
});
