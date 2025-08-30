import { test, expect } from '@playwright/test';

test.describe('v1.2 Acceptance Criteria', () => {
  test('EP-CLR03: Theme toggle works across routes', async ({ page }) => {
    await page.goto('/');
    
    // Check dark mode by default
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('dark');
    
    // Toggle to light mode
    await page.click('[aria-label="Toggle theme"]');
    await page.waitForTimeout(500);
    
    const htmlClassAfter = await page.locator('html').getAttribute('class');
    expect(htmlClassAfter).toContain('light');
    
    // Navigate to another page and verify persistence
    await page.goto('/pricing');
    const htmlClassPricing = await page.locator('html').getAttribute('class');
    expect(htmlClassPricing).toContain('light');
  });

  test('EP-CLR03: Gold gradient applied to Power tier', async ({ page }) => {
    await page.goto('/');
    const powerCard = page.locator('.power-tier-card');
    await expect(powerCard).toBeVisible();
    await expect(powerCard).toHaveClass(/border-gold/);
  });

  test('EP-CPY03: Hero taglines visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=No lock-in. Always the best deal.')).toBeVisible();
    await expect(page.locator('text=Transparent 50% margins — always fair.')).toBeVisible();
    await expect(page.locator('text=Your data, your models, your savings.')).toBeVisible();
  });

  test('EP-CPY03: Footer motto present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Built by EXPREZZZ Power • Powered by Hurricane Power')).toBeVisible();
  });

  test('EP-AD01: Admin route requires authentication', async ({ page }) => {
    const response = await page.goto('/admin/dashboard');
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('EP-PF06: All public pages return 200', async ({ request }) => {
    const pages = ['/chat', '/pricing', '/referrals', '/models'];
    
    for (const path of pages) {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
    }
  });
});