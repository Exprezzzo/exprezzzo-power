import { test, expect } from '@playwright/test';

test.describe('EP-PF06: Smoke Tests', () => {
  test('health check returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  test('public pages return 200', async ({ page }) => {
    const pages = ['/chat', '/pricing', '/referrals', '/models'];
    
    for (const path of pages) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
    }
  });

  test('admin dashboard requires authentication', async ({ page }) => {
    const response = await page.goto('/admin/dashboard');
    // Should redirect to login or return 401/302
    expect([302, 401]).toContain(response?.status());
  });

  test('chat API streams SSE data', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'test' }],
        model: 'gpt-3.5-turbo',
      },
      headers: {
        'Accept': 'text/event-stream',
      },
    });
    
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('data:');
  });

  test('capture homepage screenshot', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ 
      path: 'test-results/homepage.png',
      fullPage: true 
    });
  });

  test('capture pricing page screenshot', async ({ page }) => {
    await page.goto('/pricing');
    await page.screenshot({ 
      path: 'test-results/pricing.png',
      fullPage: true 
    });
  });
});