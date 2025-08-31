import { test, expect } from '@playwright/test';

test('admin requires claim', async ({ page }) => {
  const res = await page.goto('/admin/dashboard');
  expect(res?.status()).toBeGreaterThanOrEqual(300);
});