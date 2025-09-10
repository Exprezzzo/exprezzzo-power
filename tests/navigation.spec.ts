import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('navbar links work', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Chat');
    await expect(page).toHaveURL(/.*chat/);

    await page.click('text=Pricing');
    await expect(page).toHaveURL(/.*pricing/);

    await page.click('text=Models');
    await expect(page).toHaveURL(/.*models/);

    await page.click('text=Referrals');
    await expect(page).toHaveURL(/.*referrals/);
  });

  test('stub pages load correctly', async ({ page }) => {
    const pages = ['/about', '/blog', '/contact', '/privacy'];
    
    for (const path of pages) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('Coming Soon')).toBeVisible();
    }
  });

  test('theme toggle works site-wide', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Toggle theme"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('admin dashboard redirects unauthenticated', async ({ page }) => {
    const res = await page.goto('/admin/dashboard');
    expect(res?.status()).toBeGreaterThanOrEqual(300);
  });

  test('footer motto persists', async ({ page }) => {
    const pages = ['/', '/about', '/blog', '/contact', '/privacy'];
    
    for (const path of pages) {
      await page.goto(path);
      await expect(page.getByText('Built by EXPREZZZ Power • Powered by Hurricane Power')).toBeVisible();
    }
  });

  test('Get Started routes to pricing', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Get Started');
    await expect(page).toHaveURL(/.*pricing/);
  });
});