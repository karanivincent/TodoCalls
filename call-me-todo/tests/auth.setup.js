import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';
const testUser = {
  email: 'nehey63520@evoxury.com',
  password: 'nehey63520@evoxury.com'
};

setup('authenticate', async ({ page }) => {
  console.log('🔑 Setting up authentication...');
  
  // Go to the auth page
  await page.goto('/auth');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check if we're on the auth page
  await expect(page.getByText('Continue with Google')).toBeVisible();
  
  // Fill in the email field
  const emailField = page.getByPlaceholder('john@example.com').or(page.getByLabel('Email Address'));
  await emailField.fill(testUser.email);
  
  // Fill in the password field  
  const passwordField = page.getByPlaceholder('Choose a secure password').or(page.getByLabel('Password'));
  await passwordField.fill(testUser.password);
  
  // Try to sign in (if account exists) or sign up (if account doesn't exist)
  // First check if there's a "Sign in instead" link, which means we're on signup form
  const signInLink = page.getByText('Sign in instead');
  
  if (await signInLink.isVisible()) {
    // We're on signup form, but user might already exist, click sign in
    console.log('📝 Switching to sign in form...');
    await signInLink.click();
    await page.waitForTimeout(1000);
    
    // Fill form again after switching
    await page.getByPlaceholder('john@example.com').fill(testUser.email);
    await page.getByPlaceholder('Enter your password').fill(testUser.password);
    
    // Click sign in button
    await page.getByRole('button', { name: 'Sign In' }).click();
  } else {
    // We might be on sign in form already, or need to create account
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    const signUpButton = page.getByRole('button', { name: 'Start Free Trial' });
    
    if (await signInButton.isVisible()) {
      console.log('🔐 Attempting to sign in...');
      await signInButton.click();
    } else if (await signUpButton.isVisible()) {
      console.log('📝 Creating new account...');
      // Check the terms checkbox if it exists
      const termsCheckbox = page.getByText('I agree to the Terms of Service');
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.click();
      }
      await signUpButton.click();
    }
  }
  
  // Wait for navigation after login/signup
  console.log('⏳ Waiting for authentication to complete...');
  
  // Wait for successful login (may redirect to different pages)
  await page.waitForTimeout(3000);
  
  // If we're on a profile/phone setup page, we might need to skip or complete it
  if (page.url().includes('/profile') || await page.getByText('Add your phone number').isVisible().catch(() => false)) {
    console.log('📞 Skipping phone number setup...');
    const skipButton = page.getByText('Skip for now').or(page.getByText('Continue without phone'));
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(2000);
    }
  }
  
  // Always navigate to dashboard explicitly after login
  console.log('🏠 Navigating to dashboard...');
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Verify we're authenticated by checking for dashboard or user-specific content
  await page.waitForLoadState('networkidle');
  
  // Look for dashboard indicators or user menu
  const dashboardIndicators = [
    page.getByText('Welcome back'),
    page.getByText('Today'),
    page.getByText('Timeline'),
    page.getByPlaceholder('Try: "Remind Mom to take medication at 9am"')
  ];
  
  let authenticated = false;
  for (const indicator of dashboardIndicators) {
    if (await indicator.isVisible().catch(() => false)) {
      authenticated = true;
      break;
    }
  }
  
  if (!authenticated) {
    throw new Error('❌ Authentication failed - no dashboard indicators found');
  }
  
  console.log('✅ Authentication successful! Saving auth state...');
  
  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: authFile });
  
  console.log(`💾 Auth state saved to ${authFile}`);
});