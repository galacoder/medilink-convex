/**
 * MediLink Sign-in Flow Test - v2
 *
 * WHY v2: The sign-in flow has a 3-step redirect chain:
 *   1. signIn.email() → session cookies set
 *   2. window.location.href = "/" → proxy Branch 1.5 detects missing medilink-org-context
 *   3. Proxy → /api/auth/init → sets cookie + redirects to correct portal
 *
 * v1 was stopping after step 2 (final URL was "/" before init completed).
 * v2 waits for the full chain to settle.
 */

const { chromium } = require('/home/sangle/dev/medilink-convex/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = '/tmp/medilink-signin-screenshots-v2';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  [screenshot] ${filePath}`);
  return filePath;
}

async function waitForFinalURL(page, timeoutMs = 10000) {
  /**
   * WHY: The full sign-in redirect chain is:
   *   sign-in page → "/" → /api/auth/init → /hospital|admin|provider/dashboard
   * We wait until the URL is NOT one of the intermediate URLs.
   *
   * We poll every 200ms to detect when navigation settles on a non-intermediate URL.
   */
  const intermediates = ['/sign-in', '/', '/api/auth/init'];
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const url = page.url();
    const pathname = new URL(url).pathname;
    const isIntermediate = intermediates.some(p => pathname === p || pathname === p + '/');
    if (!isIntermediate) {
      return url;
    }
    await page.waitForTimeout(300);
  }
  // Return whatever URL we're on after timeout
  return page.url();
}

async function fillAndSubmitSignIn(page, email, password) {
  await page.waitForSelector('form', { timeout: 8000 });

  // Fill email by id
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
}

async function findErrorMessage(page) {
  const selectors = [
    '[class*="destructive"]',
    '[role="alert"]',
    '[data-sonner-toast]',
    '.text-destructive',
  ];
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        const text = (await el.textContent() ?? '').trim();
        // Filter out the submit button text "Đăng nhập"
        if (text && text !== 'Đăng nhập') return text;
      }
    } catch {}
  }
  return null;
}

async function runTests() {
  console.log('Launching Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = [];

  // ── SETUP ─────────────────────────────────────────────────────────────────
  console.log('\n=== SETUP: Verify sign-in page at http://localhost:3002/sign-in ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });

    const url = page.url();
    const title = await page.title();
    const bodyText = await page.textContent('body');

    // Check amber dev banner
    const amberEl = await page.$('[class*="amber"]');
    const bannerText = amberEl ? (await amberEl.textContent() ?? '').trim() : null;
    const hasBanner3002 = bodyText.includes('3002') || (bannerText ?? '').includes('3002');

    console.log(`  URL: ${url}`);
    console.log(`  Title: ${title}`);
    console.log(`  Amber banner: ${bannerText ?? '(none)'}`);
    console.log(`  Shows :3002: ${hasBanner3002}`);

    await takeScreenshot(page, '00-setup-signin-page');
    await ctx.close();
  }

  // ── TEST 1: Hospital user ─────────────────────────────────────────────────
  console.log('\n=== TEST 1: Hospital user (lan.tran@spmet.edu.vn) ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    try {
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });

      const bodyTextPre = await page.textContent('body');
      const banner = await page.$('[class*="amber"]');
      const bannerText = banner ? (await banner.textContent() ?? '').trim() : null;
      console.log(`  Amber banner: ${bannerText ?? '(none)'}`);
      console.log(`  Shows :3002: ${bodyTextPre.includes('3002')}`);

      await takeScreenshot(page, '01a-hospital-signin-page');

      await fillAndSubmitSignIn(page, 'lan.tran@spmet.edu.vn', 'TestPassword@123');

      // Wait for the full redirect chain to complete
      const finalUrl = await waitForFinalURL(page, 10000);
      await page.waitForTimeout(800); // extra buffer for page render

      const finalPath = new URL(finalUrl).pathname;
      const succeeded = !finalUrl.includes('/sign-in');
      const correctRedirect = finalPath === '/hospital/dashboard' || finalPath.startsWith('/hospital/');
      const errorText = await findErrorMessage(page);

      console.log(`  Sign-in succeeded: ${succeeded}`);
      console.log(`  Final URL: ${finalUrl}`);
      console.log(`  Correct redirect (/hospital/dashboard): ${correctRedirect}`);
      if (errorText) console.log(`  Error message: ${errorText}`);

      await takeScreenshot(page, '01b-hospital-after-signin');

      results.push({
        test: 'Hospital user (lan.tran@spmet.edu.vn)',
        succeeded,
        finalUrl,
        expectedRedirect: '/hospital/dashboard',
        correctRedirect,
        errorText,
      });
    } catch (err) {
      console.log(`  SCRIPT ERROR: ${err.message}`);
      await takeScreenshot(page, '01-error').catch(() => {});
      results.push({ test: 'Hospital user', succeeded: false, error: err.message, finalUrl: page.url() });
    }
    await ctx.close();
  }

  // ── TEST 2: Admin user ────────────────────────────────────────────────────
  console.log('\n=== TEST 2: Admin user (admin@medilink.vn) ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    try {
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
      await fillAndSubmitSignIn(page, 'admin@medilink.vn', 'TestPassword@123');

      const finalUrl = await waitForFinalURL(page, 10000);
      await page.waitForTimeout(800);

      const finalPath = new URL(finalUrl).pathname;
      const succeeded = !finalUrl.includes('/sign-in');
      const correctRedirect = finalPath === '/admin/dashboard' || finalPath.startsWith('/admin/');
      const errorText = await findErrorMessage(page);

      console.log(`  Sign-in succeeded: ${succeeded}`);
      console.log(`  Final URL: ${finalUrl}`);
      console.log(`  Correct redirect (/admin/dashboard): ${correctRedirect}`);
      if (errorText) console.log(`  Error message: ${errorText}`);

      await takeScreenshot(page, '02-admin-after-signin');

      results.push({
        test: 'Admin user (admin@medilink.vn)',
        succeeded,
        finalUrl,
        expectedRedirect: '/admin/dashboard',
        correctRedirect,
        errorText,
      });
    } catch (err) {
      console.log(`  SCRIPT ERROR: ${err.message}`);
      await takeScreenshot(page, '02-error').catch(() => {});
      results.push({ test: 'Admin user', succeeded: false, error: err.message, finalUrl: page.url() });
    }
    await ctx.close();
  }

  // ── TEST 3: Provider user ─────────────────────────────────────────────────
  console.log('\n=== TEST 3: Provider user (minh.le@techmed.vn) ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    try {
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
      await fillAndSubmitSignIn(page, 'minh.le@techmed.vn', 'TestPassword@123');

      const finalUrl = await waitForFinalURL(page, 10000);
      await page.waitForTimeout(800);

      const finalPath = new URL(finalUrl).pathname;
      const succeeded = !finalUrl.includes('/sign-in');
      const correctRedirect = finalPath === '/provider/dashboard' || finalPath.startsWith('/provider/');
      const errorText = await findErrorMessage(page);

      console.log(`  Sign-in succeeded: ${succeeded}`);
      console.log(`  Final URL: ${finalUrl}`);
      console.log(`  Correct redirect (/provider/dashboard): ${correctRedirect}`);
      if (errorText) console.log(`  Error message: ${errorText}`);

      await takeScreenshot(page, '03-provider-after-signin');

      results.push({
        test: 'Provider user (minh.le@techmed.vn)',
        succeeded,
        finalUrl,
        expectedRedirect: '/provider/dashboard',
        correctRedirect,
        errorText,
      });
    } catch (err) {
      console.log(`  SCRIPT ERROR: ${err.message}`);
      await takeScreenshot(page, '03-error').catch(() => {});
      results.push({ test: 'Provider user', succeeded: false, error: err.message, finalUrl: page.url() });
    }
    await ctx.close();
  }

  // ── TEST 4: Invalid credentials ───────────────────────────────────────────
  console.log('\n=== TEST 4: Invalid credentials (wrong@test.com / wrongpass) ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    try {
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
      await fillAndSubmitSignIn(page, 'wrong@test.com', 'wrongpass');

      // Wait for error to appear (no redirect expected)
      await page.waitForTimeout(3000);

      const finalUrl = page.url();
      const stayedOnSignIn = finalUrl.includes('/sign-in');
      const errorText = await findErrorMessage(page);

      // Grab all text in error-area elements
      let rawErrorText = null;
      try {
        const errEl = await page.$('[class*="destructive"], [role="alert"]');
        if (errEl) rawErrorText = (await errEl.textContent() ?? '').trim();
      } catch {}

      console.log(`  Stayed on sign-in (expected): ${stayedOnSignIn}`);
      console.log(`  Final URL: ${finalUrl}`);
      console.log(`  Error found: ${errorText ?? rawErrorText ?? '(check screenshot)'}`);

      await takeScreenshot(page, '04-invalid-credentials');

      results.push({
        test: 'Invalid credentials (wrong@test.com / wrongpass)',
        succeeded: false,
        stayedOnSignIn,
        finalUrl,
        errorText: errorText ?? rawErrorText ?? '(see screenshot)',
      });
    } catch (err) {
      console.log(`  SCRIPT ERROR: ${err.message}`);
      await takeScreenshot(page, '04-error').catch(() => {});
      results.push({ test: 'Invalid credentials', succeeded: false, error: err.message });
    }
    await ctx.close();
  }

  await browser.close();

  // ── FINAL SUMMARY ─────────────────────────────────────────────────────────
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL TEST SUMMARY (v2)                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  for (const r of results) {
    const status = r.succeeded ? 'PASS' : (r.stayedOnSignIn === true ? 'PASS (blocked)' : 'FAIL');
    console.log(`\n  [${status}] ${r.test}`);
    console.log(`    Final URL       : ${r.finalUrl ?? 'N/A'}`);
    if (r.expectedRedirect) {
      console.log(`    Expected        : ${r.expectedRedirect}`);
      console.log(`    Correct portal  : ${r.correctRedirect}`);
    }
    if (r.stayedOnSignIn !== undefined) {
      console.log(`    Stayed on /sign-in (expected=true): ${r.stayedOnSignIn}`);
    }
    if (r.errorText) {
      console.log(`    Error shown     : ${r.errorText}`);
    }
    if (r.error) {
      console.log(`    Script error    : ${r.error}`);
    }
  }

  console.log(`\nScreenshots: ${SCREENSHOT_DIR}`);
  fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => console.log(`  ${SCREENSHOT_DIR}/${f}`));
}

runTests().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
