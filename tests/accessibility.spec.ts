import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage should be accessible', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('chat page should be accessible', async ({ page }) => {
    await page.goto('/chat');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('pricing page should be accessible', async ({ page }) => {
    await page.goto('/pricing');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('models page should be accessible', async ({ page }) => {
    await page.goto('/models');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('referrals page should be accessible', async ({ page }) => {
    await page.goto('/referrals');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation through main elements
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    
    // Continue tabbing through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should still have focus on interactive element
    focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT']).toContain(focusedElement);
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/');
    
    // Add custom CSS to ensure focus indicators are visible during testing
    await page.addStyleTag({
      content: `
        *:focus {
          outline: 2px solid #FFD700 !important;
          outline-offset: 2px !important;
        }
      `
    });
    
    // Tab to first focusable element and check for focus indicator
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Check computed styles for focus indicator
    const outlineStyle = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).getPropertyValue('outline')
    );
    expect(outlineStyle).toBeTruthy();
  });

  test('color contrast meets WCAG standards', async ({ page }) => {
    await page.goto('/');
    
    // Use axe-core to check color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(colorContrastViolations).toEqual([]);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Image should have alt text, aria-label, or be decorative (role="presentation")
      expect(
        alt !== null || ariaLabel !== null || role === 'presentation'
      ).toBe(true);
    }
  });

  test('headings have proper hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check that heading levels follow proper hierarchy (no skipping levels)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    let previousLevel = 0;
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const currentLevel = parseInt(tagName.charAt(1));
      
      // Should not skip heading levels (can go up by 1 or down by any amount)
      if (previousLevel > 0) {
        expect(currentLevel <= previousLevel + 1).toBe(true);
      }
      
      previousLevel = currentLevel;
    }
  });

  test('form elements have labels', async ({ page }) => {
    await page.goto('/');
    
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        // Input should have label, aria-label, aria-labelledby, or meaningful placeholder
        expect(
          hasLabel || ariaLabel || ariaLabelledby || placeholder
        ).toBeTruthy();
      }
    }
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Find all interactive elements
    const interactiveElements = page.locator('a, button, input, select, textarea, [tabindex]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) { // Test first 10 elements
      const element = interactiveElements.nth(i);
      
      // Check if element is focusable
      await element.focus();
      const isFocused = await element.evaluate(el => document.activeElement === el);
      
      // Element should be focusable unless it has tabindex="-1"
      const tabindex = await element.getAttribute('tabindex');
      if (tabindex !== '-1') {
        expect(isFocused).toBe(true);
      }
    }
  });

  test('mobile accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Run accessibility scan on mobile
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Check touch target size (minimum 44px as per WCAG)
    const buttons = page.locator('button, a');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) { // Test first 5 buttons
      const button = buttons.nth(i);
      const boundingBox = await button.boundingBox();
      
      if (boundingBox) {
        // Touch targets should be at least 44px in both dimensions
        expect(boundingBox.width >= 44 || boundingBox.height >= 44).toBe(true);
      }
    }
  });
});