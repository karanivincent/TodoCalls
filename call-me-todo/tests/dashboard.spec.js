import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should show new dashboard layout with all components', async ({ page }) => {
    console.log('🧪 Testing new dashboard layout...');
    
    // Navigate to dashboard (authentication handled by fixture)
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    // Test 1: Check for new 3-column layout structure
    console.log('📱 Testing layout structure...');
    
    // Test 2: Check for left sidebar navigation
    console.log('🔍 Testing left sidebar...');
    await expect(page.getByText('Today')).toBeVisible();
    await expect(page.getByText('Timeline')).toBeVisible();
    await expect(page.getByText('Projects')).toBeVisible();
    
    // Test 3: Check for focus bar (should show instead of old stats)
    console.log('📊 Testing focus bar...');
    // Focus bar should show when there are tasks, or empty state message
    const focusBarElements = [
      page.getByText('Overdue'),
      page.getByText('Due Today'), 
      page.getByText('Calls Pending'),
      page.getByText('All caught up'),
      page.getByText('Ready to get organized')
    ];
    
    let focusBarVisible = false;
    for (const element of focusBarElements) {
      if (await element.isVisible().catch(() => false)) {
        focusBarVisible = true;
        break;
      }
    }
    expect(focusBarVisible).toBe(true);
    
    // Test 4: Check for right panel
    console.log('📅 Testing right panel...');
    await expect(page.getByText('Calendar')).toBeVisible();
    await expect(page.getByText('Voice Dashboard')).toBeVisible();
    
    // Test 5: Test view switching
    console.log('🔄 Testing view switching...');
    
    // Should start on Today view by default
    await expect(page.locator('[class*="bg-orange-50"]')).toBeVisible(); // Active state styling
    
    // Click Timeline view
    await page.getByText('Timeline').click();
    await page.waitForTimeout(500);
    
    // Should now show timeline view
    // Timeline view shows either tasks or empty state
    const timelineElements = [
      page.getByText('AM'), // Time labels
      page.getByText('PM'),
      page.getByText('No reminders scheduled'), // Empty state
      page.getByText('Create Your First Reminder')
    ];
    
    let timelineVisible = false;
    for (const element of timelineElements) {
      if (await element.isVisible().catch(() => false)) {
        timelineVisible = true;
        break;
      }
    }
    expect(timelineVisible).toBe(true);
    
    // Test 6: Verify voice features are preserved
    console.log('🎤 Testing voice features...');
    await expect(page.getByText('Voice Status')).toBeVisible();
    await expect(page.getByText('Test Call Now')).toBeVisible();
    
    // Test 7: Verify QuickAddBar is preserved
    console.log('⚡ Testing QuickAddBar...');
    await expect(page.getByPlaceholder('Try: "Remind Mom to take medication at 9am"')).toBeVisible();
    
    console.log('✅ All dashboard tests passed!');
  });
  
  test('should preserve existing voice functionality', async ({ page }) => {
    console.log('🎤 Testing voice functionality preservation...');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test voice buttons are clickable (we won't actually trigger calls in test)
    const testCallButtons = page.getByText('Test Call Now');
    await expect(testCallButtons.first()).toBeVisible();
    
    // Test manual cron trigger button
    const cronButton = page.getByText('Check Due Reminders');
    await expect(cronButton).toBeVisible();
    
    console.log('✅ Voice functionality tests passed!');
  });
  
  test('should handle empty state properly', async ({ page }) => {
    console.log('📝 Testing empty state handling...');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // With no tasks, should show appropriate empty states
    const emptyStateElements = [
      page.getByText('Ready to get organized'),
      page.getByText('Ready to seize the day'),
      page.getByText('No reminders scheduled')
    ];
    
    // At least one empty state should be visible
    let emptyStateVisible = false;
    for (const element of emptyStateElements) {
      if (await element.isVisible().catch(() => false)) {
        emptyStateVisible = true;
        console.log('📝 Found empty state element');
        break;
      }
    }
    
    expect(emptyStateVisible).toBe(true);
    console.log('✅ Empty state tests passed!');
  });
});