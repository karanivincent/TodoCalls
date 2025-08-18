import { chromium } from 'playwright';

async function checkDeployment() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to https://telitask.com/');
  await page.goto('https://telitask.com/', { waitUntil: 'networkidle' });
  
  // Take screenshot
  await page.screenshot({ path: 'deployment-check-2.png', fullPage: true });
  console.log('Screenshot saved as deployment-check-2.png');
  
  // Check page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for 404 error
  const pageContent = await page.content();
  if (pageContent.includes('404') || pageContent.includes('NOT_FOUND')) {
    console.log('❌ Deployment still showing 404 error');
  } else if (pageContent.includes('Call-Me Todo') || pageContent.includes('todo')) {
    console.log('✅ Deployment successful! App is running');
  }
  
  await browser.close();
}

checkDeployment().catch(console.error);