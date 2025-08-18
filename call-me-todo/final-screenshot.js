import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport for better screenshot
  await page.setViewportSize({ width: 1440, height: 900 });
  
  console.log('Navigating to https://telitask.com/');
  await page.goto('https://telitask.com/', { waitUntil: 'networkidle' });
  
  // Wait a bit for any animations
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'deployment-success.png', fullPage: true });
  console.log('✅ Screenshot saved as deployment-success.png');
  
  // Also check the auth page
  await page.goto('https://telitask.com/auth', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'auth-page.png', fullPage: true });
  console.log('✅ Auth page screenshot saved as auth-page.png');
  
  await browser.close();
}

takeScreenshot().catch(console.error);