import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const routes = [
  { name: 'home', path: '/', description: 'Landing page' },
  { name: 'home-contact', path: '/#contact', description: 'Landing page - Contact section', scroll: true },
  { name: 'auth', path: '/auth', description: 'Authentication page' },
  { name: 'dashboard', path: '/dashboard', description: 'Dashboard (requires auth)' }
];

async function takeScreenshots() {
  // Create screenshots directory
  const screenshotsDir = './screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  // Launch browser
  const browser = await chromium.launch({ 
    headless: false // Set to false to see the browser
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Console error on ${page.url()}: ${msg.text()}`);
    }
  });

  // Capture network errors
  page.on('pageerror', error => {
    console.error(`Page error on ${page.url()}: ${error.message}`);
  });

  // Take screenshots of each route
  for (const route of routes) {
    console.log(`📸 Taking screenshot of ${route.name} (${route.path})`);
    
    try {
      // Navigate to route
      const response = await page.goto(`http://localhost:5173${route.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Check response status
      if (!response.ok() && response.status() !== 304) {
        console.error(`❌ Error loading ${route.name}: HTTP ${response.status()}`);
      }

      // Wait a bit for any animations or lazy loading
      await page.waitForTimeout(2000);
      
      // If this route needs scrolling (like contact section)
      if (route.scroll) {
        await page.evaluate(() => {
          const element = document.querySelector('#contact');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        await page.waitForTimeout(1000); // Wait for scroll animation
      }

      // Take full page screenshot
      await page.screenshot({
        path: path.join(screenshotsDir, `${route.name}-fullpage.png`),
        fullPage: true
      });

      // Take viewport screenshot
      await page.screenshot({
        path: path.join(screenshotsDir, `${route.name}-viewport.png`),
        fullPage: false
      });

      console.log(`✅ Screenshot saved: ${route.name}`);

      // Check for any visible errors on the page
      const errorElements = await page.$$('[class*="error"], [class*="Error"], [data-error]');
      if (errorElements.length > 0) {
        console.warn(`⚠️  Found ${errorElements.length} potential error elements on ${route.name}`);
        
        // Take screenshot of error elements
        for (let i = 0; i < errorElements.length; i++) {
          const element = errorElements[i];
          const text = await element.textContent();
          console.warn(`   Error ${i + 1}: ${text}`);
        }
      }

    } catch (error) {
      console.error(`❌ Failed to screenshot ${route.name}: ${error.message}`);
    }
  }

  // Test authenticated routes
  console.log('\n🔐 Testing authenticated route (dashboard)...');
  
  // For demo purposes, we'll check if auth redirect works
  await page.goto('http://localhost:5173/dashboard', {
    waitUntil: 'networkidle'
  });
  
  // Check if redirected to auth
  if (page.url().includes('/auth')) {
    console.log('✅ Dashboard correctly redirects to auth when not logged in');
  } else {
    console.warn('⚠️  Dashboard may not be properly protected');
  }

  // Test mobile responsiveness
  console.log('\n📱 Taking mobile screenshots...');
  
  // Create new context for mobile
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 } // iPhone SE size
  });
  const mobilePage = await mobileContext.newPage();
  
  for (const route of routes) {
    await mobilePage.goto(`http://localhost:5173${route.path}`, {
      waitUntil: 'networkidle'
    });
    
    await mobilePage.waitForTimeout(1000);
    
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, `${route.name}-mobile.png`),
      fullPage: false
    });
    
    console.log(`📱 Mobile screenshot saved: ${route.name}`);
  }
  
  await mobileContext.close();

  // Close browser
  await browser.close();
  
  console.log('\n✨ All screenshots completed!');
  console.log(`📁 Screenshots saved in: ${path.resolve(screenshotsDir)}`);
}

// Run the script
takeScreenshots().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});