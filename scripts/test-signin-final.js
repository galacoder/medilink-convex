/**
 * MediLink Sign-in Final Test
 * Waits for the FULL redirect chain to complete including /api/auth/init → portal
 *
 * The chain is:
 *  1. signIn.email() → session cookies set → window.location.href = "/"
 *  2. "/" → proxy Branch 1.5 → 307 to /api/auth/init
 *  3. /api/auth/init → sets medilink-org-context cookie → 307 to /hospital|admin|provider/dashboard
 *  4. dashboard → proxy allows through (org context cookie now set)
 *
 * We wait for URL to settle on a dashboard-like path.
 */

const { chromium } = require('/home/sangle/dev/medilink-convex/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = '/tmp/medilink-signin-final';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page, name) {
  const p = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`  [screenshot] ${p}`);
}

async function waitForDashboard(page, timeoutMs = 15000) {
  /**
   * Wait until URL contains /dashboard or /admin or /hospital or /provider
   * but is NOT /sign-in, /, or /api/
   */
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const url = page.url();
    const pathname = new URL(url).pathname;
    // Check if we're on a portal page (not intermediate)
    if (
      pathname.includes('/dashboard') ||
      pathname.startsWith('/hospital/') ||
      pathname.startsWith('/admin/') ||
      pathname.startsWith('/provider/') ||
      pathname.startsWith('/sign-up')
    ) {
      return url;
    }
    // Still on intermediate, keep waiting
    await page.waitForTimeout(500);
  }
  return page.url();
}

async function testUser(email, password, expectedPath, testName) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Log all navigations
  const navLog = [];
  page.on('framenavigated', f => {
    if (f === page.mainFrame()) {
      navLog.push(f.url());
    }
  });

  try {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.fill('#email', email);
    await page.fill('#password', password);

    navLog.length = 0; // reset before submit
    await page.click('button[type="submit"]');

    // Wait for full chain
    const finalUrl = await waitForDashboard(page, 15000);
    await page.waitForTimeout(500); // let page render

    const finalPath = new URL(finalUrl).pathname;
    const cookies = await ctx.cookies();
    const orgCtx = cookies.find(c => c.name === 'medilink-org-context');
    const errorEl = await page.$('[class*="destructive"]');
    const errorText = errorEl ? (await errorEl.textContent() ?? '').trim() : null;

    // Check expected
    const succeeded = !finalUrl.includes('/sign-in');
    const correctPortal = finalPath.startsWith(expectedPath);

    console.log(`\n[${testName}] ${email}`);
    console.log(`  Navigation chain: ${navLog.join(' → ')}`);
    console.log(`  Final URL: ${finalUrl}`);
    console.log(`  Expected portal prefix: ${expectedPath}`);
    console.log(`  Sign-in succeeded: ${succeeded}`);
    console.log(`  Correct portal: ${correctPortal}`);
    console.log(`  medilink-org-context cookie: ${orgCtx ? orgCtx.value : 'NOT SET'}`);
    if (errorText && errorText !== 'Đăng nhập') {
      console.log(`  Error shown: ${errorText}`);
    }

    await takeScreenshot(page, testName);
    await browser.close();

    return { testName, email, succeeded, finalUrl, correctPortal, orgCtx: orgCtx?.value, errorText, navChain: navLog };
  } catch (err) {
    console.log(`  SCRIPT ERROR: ${err.message}`);
    await takeScreenshot(page, `${testName}-error`).catch(() => {});
    await browser.close();
    return { testName, email, succeeded: false, error: err.message };
  }
}

async function testInvalidCreds() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.fill('#email', 'wrong@test.com');
    await page.fill('#password', 'wrongpass');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    const stayedOnSignIn = finalUrl.includes('/sign-in');
    const errorEl = await page.$('[class*="destructive"]');
    const errorText = errorEl ? (await errorEl.textContent() ?? '').trim() : null;

    console.log(`\n[invalid-creds] wrong@test.com / wrongpass`);
    console.log(`  Final URL: ${finalUrl}`);
    console.log(`  Stayed on sign-in (expected=true): ${stayedOnSignIn}`);
    console.log(`  Error message: ${errorText ?? '(none)'}`);

    await takeScreenshot(page, 'test4-invalid-creds');
    await browser.close();

    return { testName: 'Invalid credentials', stayedOnSignIn, finalUrl, errorText };
  } catch (err) {
    console.log(`  SCRIPT ERROR: ${err.message}`);
    await browser.close();
    return { testName: 'Invalid credentials', error: err.message };
  }
}

async function main() {
  console.log('=== MediLink Sign-in Flow Test (Final) ===\n');
  console.log('Each test uses a FRESH browser context (no shared cookies).');

  const results = [];

  // Setup: verify page
  {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
    const title = await page.title();
    const amberEl = await page.$('[class*="amber"]');
    const bannerText = amberEl ? (await amberEl.textContent() ?? '').trim() : null;
    console.log(`\n[SETUP] Sign-in page`);
    console.log(`  URL: ${page.url()}`);
    console.log(`  Title: ${title}`);
    console.log(`  Amber dev banner: ${bannerText ?? '(none)'}`);
    console.log(`  Shows :3002: ${(bannerText ?? '').includes('3002')}`);
    await takeScreenshot(page, 'test0-setup');
    await browser.close();
  }

  // Test 1: Hospital
  results.push(await testUser('lan.tran@spmet.edu.vn', 'TestPassword@123', '/hospital/', 'test1-hospital'));

  // Test 2: Admin
  results.push(await testUser('admin@medilink.vn', 'TestPassword@123', '/admin/', 'test2-admin'));

  // Test 3: Provider
  results.push(await testUser('minh.le@techmed.vn', 'TestPassword@123', '/provider/', 'test3-provider'));

  // Test 4: Invalid
  results.push(await testInvalidCreds());

  // Final summary
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                  FINAL RESULTS SUMMARY                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  const testDefs = [
    { name: 'Test 1 - Hospital user (lan.tran@spmet.edu.vn)', idx: 0, expected: '/hospital/dashboard' },
    { name: 'Test 2 - Admin user (admin@medilink.vn)', idx: 1, expected: '/admin/dashboard' },
    { name: 'Test 3 - Provider user (minh.le@techmed.vn)', idx: 2, expected: '/provider/dashboard' },
    { name: 'Test 4 - Invalid credentials', idx: 3, expected: 'stay on /sign-in' },
  ];

  testDefs.forEach(def => {
    const r = results[def.idx];
    if (!r) return;
    console.log(`  ${def.name}`);
    console.log(`    Expected: ${def.expected}`);
    if (r.finalUrl) console.log(`    Final URL: ${r.finalUrl}`);
    if (r.succeeded !== undefined) console.log(`    Sign-in succeeded: ${r.succeeded}`);
    if (r.correctPortal !== undefined) console.log(`    Correct portal: ${r.correctPortal}`);
    if (r.stayedOnSignIn !== undefined) console.log(`    Stayed on sign-in: ${r.stayedOnSignIn}`);
    if (r.errorText) console.log(`    Error shown: ${r.errorText}`);
    if (r.orgCtx) console.log(`    Org context cookie: ${r.orgCtx}`);
    if (r.error) console.log(`    Script error: ${r.error}`);
    console.log('');
  });

  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
