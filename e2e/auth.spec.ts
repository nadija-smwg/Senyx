import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully with admin credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Check if we're on the login page
    await expect(page.locator('text=Welcome back')).toBeVisible();

    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@senyx.com');
    // Note: Update this password to match what you registered in Supabase
    await page.fill('input[type="password"]', 'password123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify successful login
    // Usually redirects to /dashboard or similar. 
    // We wait for the URL to change or for a logged-in indicator
    await expect(page).not.toHaveURL('/login', { timeout: 10000 });
    
    // Add specific dashboard assertions here once known
    // await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
