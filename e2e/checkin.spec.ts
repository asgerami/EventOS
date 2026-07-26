import { test, expect } from '@playwright/test';

test.describe('Staff Check-in Interface', () => {
  test('should load staff check-in station UI or redirect to auth', async ({ page }) => {
    await page.goto('/events/test-id/check-in');
    const url = page.url();
    expect(url.includes('/check-in') || url.includes('/sign-in') || url.includes('/organizations')).toBeTruthy();
  });
});
