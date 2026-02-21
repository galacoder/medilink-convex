/**
 * MediLink Sign-in Debug Test
 * Logs all navigation/redirects to trace exactly where the chain breaks
 */

const { chromium } = require('/home/sangle/dev/medilink-convex/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = '/tmp/medilink-signin-debug';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function debugSignIn(email, password, testName) {
  const { chromium: chromiumBrowser } = require('/home/sangle/dev/medilink-convex/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
  const browser = await chromiumBrowser.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Track all navigations
  const navLog = [];
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      navLog.push({ type: 'nav', url: frame.url(), time: Date.now() });
    }
  });

  // Track responses (to catch redirects)
  page.on('response', response => {
    const status = response.status();
    if (status >= 300 && status < 400) {
      navLog.push({
        type: 'redirect',
        from: response.url(),
        status,
        location: response.headers()['location'] ?? '(none)',
        time: Date.now(),
      });
    }
  });

  console.log(`\n[${testName}] Starting...`);

  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
  navLog.length = 0; // Clear navigations before sign-in

  await page.waitForSelector('#email', { timeout: 5000 });
  await page.fill('#email', email);
  await page.fill('#password', password);

  // Click submit and watch what happens
  const submitStart = Date.now();
  await page.click('button[type="submit"]');

  // Wait for 8 seconds total to see the full chain
  await page.waitForTimeout(8000);

  const finalUrl = page.url();

  // Log all cookies
  const cookies = await ctx.cookies();
  const relevantCookies = cookies.filter(c =>
    c.name.includes('better-auth') || c.name.includes('medilink')
  );

  console.log(`  Navigation log (from submit click):`);
  navLog.forEach((n, i) => {
    const elapsed = n.time - submitStart;
    if (n.type === 'nav') {
      console.log(`    ${i+1}. [+${elapsed}ms] Navigate: ${n.url}`);
    } else if (n.type === 'redirect') {
      console.log(`    ${i+1}. [+${elapsed}ms] Redirect ${n.status}: ${n.from} → ${n.location}`);
    }
  });

  console.log(`  Final URL: ${finalUrl}`);
  console.log(`  Cookies set:`);
  relevantCookies.forEach(c => {
    console.log(`    - ${c.name} = ${c.value.slice(0, 40)}...`);
  });

  // Screenshot of final state
  const screenshot = path.join(SCREENSHOT_DIR, `${testName.replace(/\s+/g, '-').toLowerCase()}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  console.log(`  Screenshot: ${screenshot}`);

  await browser.close();
  return { finalUrl, navLog, cookies: relevantCookies };
}

async function main() {
  console.log('=== MediLink Sign-in Debug ===');
  console.log('Tracing full redirect chain for each user type\n');

  // Test hospital user
  await debugSignIn('lan.tran@spmet.edu.vn', 'TestPassword@123', 'hospital-user');

  // Test admin
  await debugSignIn('admin@medilink.vn', 'TestPassword@123', 'admin-user');

  // Test provider
  await debugSignIn('minh.le@techmed.vn', 'TestPassword@123', 'provider-user');

  // Test invalid
  await debugSignIn('wrong@test.com', 'wrongpass', 'invalid-creds');

  console.log('\n=== Debug complete ===');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
