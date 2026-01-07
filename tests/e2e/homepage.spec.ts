import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Korella CRM/);

    // Check heading is visible
    const heading = page.locator('h1');
    await expect(heading).toContainText('Korella CRM');
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Should still load properly
    await expect(page.locator('h1')).toBeVisible();
  });
});
