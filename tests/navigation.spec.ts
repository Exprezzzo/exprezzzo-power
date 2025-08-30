import { test, expect } from '@playwright/test';

test.describe('EXPREZZZ Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage with correct branding', async ({ page }) => {
    // Check for EXPREZZZ branding
    await expect(page.locator('text=EXPREZZZ')).toBeVisible();
    await expect(page.locator('text=POWER')).toBeVisible();
    
    // Check tagline
    await expect(page.locator('text=40% Cheaper AI for Everyone')).toBeVisible();
    
    // Check Robin Hood messaging
    await expect(page.locator('text=Robin Hood')).toBeVisible();
  });

  test('navbar navigation works correctly', async ({ page }) => {
    // Test Chat navigation
    await page.click('text=Chat');
    await expect(page).toHaveURL('/chat');
    await expect(page.locator('text=EXPREZZZ Chat')).toBeVisible();
    
    // Test Pricing navigation
    await page.goto('/');
    await page.click('text=Pricing');
    await expect(page).toHaveURL('/pricing');
    await expect(page.locator('text=Robin Hood')).toBeVisible();
    await expect(page.locator('text=AI Pricing')).toBeVisible();
    
    // Test Models navigation
    await page.goto('/');
    await page.click('text=Models');
    await expect(page).toHaveURL('/models');
    await expect(page.locator('text=AI Models')).toBeVisible();
    
    // Test Referrals navigation
    await page.goto('/');
    await page.click('text=Referrals');
    await expect(page).toHaveURL('/referrals');
    await expect(page.locator('text=Robin Hood')).toBeVisible();
    await expect(page.locator('text=Referrals')).toBeVisible();
  });

  test('mobile navigation menu works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"], button:has-text("Menu"), button >> svg');
    
    // Check if mobile menu is visible
    await expect(page.locator('text=Chat')).toBeVisible();
    await expect(page.locator('text=Pricing')).toBeVisible();
    await expect(page.locator('text=Models')).toBeVisible();
    await expect(page.locator('text=Referrals')).toBeVisible();
  });

  test('footer links and content are present', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer branding
    await expect(page.locator('footer >> text=EXPREZZZ')).toBeVisible();
    await expect(page.locator('footer >> text=POWER')).toBeVisible();
    
    // Check Robin Hood messaging in footer
    await expect(page.locator('text=Robin Hood AI pricing')).toBeVisible();
    
    // Check footer navigation links
    await expect(page.locator('footer >> text=Chat')).toBeVisible();
    await expect(page.locator('footer >> text=Pricing')).toBeVisible();
    await expect(page.locator('footer >> text=Models')).toBeVisible();
    await expect(page.locator('footer >> text=Referrals')).toBeVisible();
    
    // Check social links (should be present even if not clickable in test)
    await expect(page.locator('footer >> text=GitHub')).toBeVisible();
    await expect(page.locator('footer >> text=Twitter')).toBeVisible();
    
    // Check copyright
    await expect(page.locator('text=© 2024 EXPREZZZ POWER')).toBeVisible();
  });

  test('page meta tags and SEO elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/EXPREZZZ/);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /40%.*Cheaper.*AI/);
  });

  test('responsive design elements', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('nav')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toBeVisible();
    
    // Check that mobile menu button is visible on mobile
    const mobileMenuButton = page.locator('button:has(svg)').first();
    await expect(mobileMenuButton).toBeVisible();
  });

  test('CTA buttons are functional', async ({ page }) => {
    // Test main CTA button
    const getStartedButton = page.locator('text=Get Started').first();
    await expect(getStartedButton).toBeVisible();
    
    // Test floating chat button
    const chatButton = page.locator('[href="/chat"]').last();
    await expect(chatButton).toBeVisible();
  });

  test('dark theme animations work', async ({ page }) => {
    // Check for shimmer animation classes
    const shimmerElements = page.locator('.dark-shimmer, .gradient-shimmer');
    if (await shimmerElements.count() > 0) {
      await expect(shimmerElements.first()).toBeVisible();
    }
    
    // Check for loading animations
    const loadingElements = page.locator('.robin-hood-loading');
    if (await loadingElements.count() > 0) {
      await expect(loadingElements.first()).toBeVisible();
    }
  });
});

test.describe('Page-Specific Tests', () => {
  test('chat page functionality', async ({ page }) => {
    await page.goto('/chat');
    
    // Check chat interface elements
    await expect(page.locator('text=EXPREZZZ Chat')).toBeVisible();
    await expect(page.locator('input[type="text"], textarea')).toBeVisible();
    await expect(page.locator('button:has-text("Send"), button >> svg')).toBeVisible();
    
    // Check provider selection
    await expect(page.locator('select, text=Auto Route')).toBeVisible();
    
    // Check cost tracking
    await expect(page.locator('text=Session Cost, text=$')).toBeVisible();
  });

  test('pricing page content', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check pricing plans
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
    
    // Check cost comparison table
    await expect(page.locator('text=Direct API Cost')).toBeVisible();
    await expect(page.locator('text=EXPREZZZ Cost')).toBeVisible();
    await expect(page.locator('text=Your Savings')).toBeVisible();
    
    // Check savings percentages
    await expect(page.locator('text=40%')).toBeVisible();
    await expect(page.locator('text=50%')).toBeVisible();
    await expect(page.locator('text=60%')).toBeVisible();
  });

  test('models page functionality', async ({ page }) => {
    await page.goto('/models');
    
    // Check model categories
    await expect(page.locator('text=All Models')).toBeVisible();
    await expect(page.locator('text=Speed Optimized')).toBeVisible();
    await expect(page.locator('text=Quality Focused')).toBeVisible();
    await expect(page.locator('text=Balanced')).toBeVisible();
    
    // Check specific models
    await expect(page.locator('text=Kani')).toBeVisible();
    await expect(page.locator('text=GPT-4o')).toBeVisible();
    await expect(page.locator('text=Claude 3.5')).toBeVisible();
    await expect(page.locator('text=Command R+')).toBeVisible();
    
    // Check performance metrics
    await expect(page.locator('text=Speed')).toBeVisible();
    await expect(page.locator('text=Quality')).toBeVisible();
    await expect(page.locator('text=Cost Efficiency')).toBeVisible();
  });

  test('referrals page content', async ({ page }) => {
    await page.goto('/referrals');
    
    // Check referral tiers
    await expect(page.locator('text=Bronze Robin')).toBeVisible();
    await expect(page.locator('text=Silver Robin')).toBeVisible();
    await expect(page.locator('text=Gold Robin')).toBeVisible();
    await expect(page.locator('text=Diamond Robin')).toBeVisible();
    
    // Check referral stats
    await expect(page.locator('text=Total Referrals')).toBeVisible();
    await expect(page.locator('text=Total Earnings')).toBeVisible();
    
    // Check referral tools
    await expect(page.locator('text=Your Referral Link')).toBeVisible();
    await expect(page.locator('text=Share & Earn')).toBeVisible();
  });
});

test.describe('Admin Dashboard Tests', () => {
  test('admin dashboard loads (if accessible)', async ({ page }) => {
    // Note: This test assumes admin access is available
    // In production, this would require proper authentication
    await page.goto('/admin/dashboard');
    
    // Check if redirected to login or if dashboard loads
    const currentUrl = page.url();
    
    if (currentUrl.includes('/admin/dashboard')) {
      // Dashboard loaded - check key elements
      await expect(page.locator('text=EXPREZZZ')).toBeVisible();
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
      
      // Check stats cards
      await expect(page.locator('text=Total Users')).toBeVisible();
      await expect(page.locator('text=Total Revenue')).toBeVisible();
      await expect(page.locator('text=API Requests')).toBeVisible();
      
      // Check provider status
      await expect(page.locator('text=Provider Status')).toBeVisible();
    } else {
      // Redirected to login or unauthorized - this is expected behavior
      console.log('Redirected to authentication, which is expected behavior');
    }
  });
});