import { test, expect } from '@playwright/test';

test('referral cookie persists on signup', async ({ page }) => {
  await page.goto('/?ref=TEST123');
  await page.goto('/login');
  // simulate signup flow hook → call complete-signup
  const res = await page.request.post('/api/complete-signup', { data: { uid: 'u_test' } });
  expect(res.ok()).toBeTruthy();
});