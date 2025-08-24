import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function takeScreenshot(url, options = {}) {
  const {
    outputPath = '/tmp/screenshot.png',
    authenticated = true,
    viewport = { width: 1400, height: 900 },
    fullPage = true,
    waitFor = 3000,
    timeout = 15000
  } = options;

  console.log(`📷 Taking screenshot of: ${url}`);
  
  // Load auth state if needed
  const authFile = 'playwright/.auth/user.json';
  let storageState = undefined;
  
  if (authenticated && fs.existsSync(authFile)) {
    console.log('🔑 Using authentication state...');
    storageState = JSON.parse(fs.readFileSync(authFile, 'utf8'));
  } else if (authenticated) {
    console.log('⚠️  No auth state found. Screenshot may show login page.');
    console.log('   Run: npm run test:setup first to authenticate');
  }

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    storageState
  });
  const page = await context.newPage();
  
  try {
    // Navigate to URL
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout 
    });
    
    // Wait for page to be ready
    await page.waitForTimeout(waitFor);
    
    // Create output directory if needed
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: outputPath,
      fullPage
    });
    
    console.log(`✅ Screenshot saved to: ${outputPath}`);
    
    // Log current URL and title for debugging
    const currentUrl = page.url();
    const title = await page.title();
    console.log(`📍 URL: ${currentUrl}`);
    console.log(`📄 Title: ${title}`);
    
    return {
      success: true,
      outputPath,
      currentUrl,
      title
    };
    
  } catch (error) {
    console.error('❌ Error taking screenshot:', error.message);
    
    // Try to take debug screenshot anyway
    try {
      const debugPath = outputPath.replace('.png', '_debug.png');
      await page.screenshot({ 
        path: debugPath,
        fullPage: true
      });
      console.log(`📷 Debug screenshot saved to: ${debugPath}`);
    } catch (debugError) {
      console.error('Could not save debug screenshot:', debugError.message);
    }
    
    return {
      success: false,
      error: error.message,
      outputPath: null
    };
    
  } finally {
    await browser.close();
  }
}

// Command line interface
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
📷 Screenshot Utility

Usage:
  node screenshot.js <url> [options]

Examples:
  node screenshot.js http://localhost:5173/dashboard
  node screenshot.js /dashboard --output /tmp/dashboard.png
  node screenshot.js /auth --no-auth --output /tmp/auth.png
  node screenshot.js / --width 1920 --height 1080

Options:
  --output, -o     Output file path (default: /tmp/screenshot.png)
  --no-auth        Don't use authentication (default: uses auth if available)
  --width          Viewport width (default: 1400)
  --height         Viewport height (default: 900)
  --wait           Wait time in ms after page load (default: 3000)
  --timeout        Page load timeout in ms (default: 15000)
  --no-full-page   Don't capture full page (default: captures full page)
  `);
  process.exit(1);
}

// Parse command line arguments
let url = args[0];
const options = {};

for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  const nextArg = args[i + 1];
  
  switch (arg) {
    case '--output':
    case '-o':
      options.outputPath = nextArg;
      i++; // skip next arg
      break;
    case '--no-auth':
      options.authenticated = false;
      break;
    case '--width':
      options.viewport = { ...options.viewport, width: parseInt(nextArg) };
      i++;
      break;
    case '--height':
      options.viewport = { ...options.viewport, height: parseInt(nextArg) };
      i++;
      break;
    case '--wait':
      options.waitFor = parseInt(nextArg);
      i++;
      break;
    case '--timeout':
      options.timeout = parseInt(nextArg);
      i++;
      break;
    case '--no-full-page':
      options.fullPage = false;
      break;
  }
}

// Convert relative URLs to full URLs
if (url.startsWith('/')) {
  url = `http://localhost:5173${url}`;
}

// Run screenshot
takeScreenshot(url, options)
  .then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });