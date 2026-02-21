/**
 * MediLink Sign-in Flow Test Script
 * Uses @playwright/test chromium to test sign-in flows
 */

const { chromium } = require('/home/sangle/dev/medilink-convex/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = '/tmp/medilink-signin-screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  [screenshot saved] ${filePath}`);
  return filePath;
}

async function fillSignInForm(page, email, password) {
  // Wait for form to be ready
  await page.waitForSelector('form', { timeout: 5000 });

  // Fill email
  const emailInput = await page.$('input[type="email"], input[name="email"], input[autocomplete="email"]');
  if (emailInput) {
    await emailInput.fill(email);
  } else {
    // Try by label text
    await page.fill('input:near(:text("email"), 100)', email);
  }

  // Fill password
  const passwordInput = await page.$('input[type="password"], input[name="password"]');
  if (passwordInput) {
    await passwordInput.fill(password);
  }

  // Submit
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }
}

async function findErrorMessage(page) {
  const selectors = [
    '[role="alert"]',
    '[data-sonner-toast]',
    '[class*="destructive"]',
    '[class*="error"]',
    '.text-destructive',
    'p[class*="text-red"]',
    '[class*="toast"]',
  ];

  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        const text = await el.textContent();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      }
    } catch {}
  }
  return null;
}

async function runTests() {
  console.log('Launching Chromium browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = [];

  // ── SETUP: Verify page loads ──────────────────────────────────────────────
  console.log('\n=== SETUP: Verify sign-in page loads at http://localhost:3002/sign-in ===');
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
      const url = page.url();
      const title = await page.title();
      const bodyText = await page.textContent('body');
      const hasBanner = bodyText.includes('3002') || bodyText.toLowerCase().includes('localhost') || bodyText.toLowerCase().includes('development') || bodyText.toLowerCase().includes('dev');

      console.log(`  Final URL: ${url}`);
      console.log(`  Page title: ${title}`);
      console.log(`  Dev banner / :3002 reference visible: ${hasBanner}`);

      // Try to find amber/yellow banner specifically
      const amberEl = await page.$('[class*="amber"], [class*="yellow"], [style*="amber"]');
      if (amberEl) {
        const amberText = await amberEl.textContent();
        console.log(`  Amber banner text: ${amberText}`);
      }

      await takeScreenshot(page, '00-setup-signin-page');
    } catch (err) {
      console.log(`  Error during setup: ${err.message}`);
    }
    await context.close();
  }

  // ── TEST 1: Hospital user ─────────────────────────────────────────────────
  console.log('\n=== TEST 1: Hospital user (lan.tran@spmet.edu.vn / TestPassword@123) ===');
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });

      const bodyText = await page.textContent('body');
      const hasBanner = bodyText.includes('3002');
      console.log(`  Dev banner shows :3002: ${hasBanner}`);
      await takeScreenshot(page, '01a-hospital-signin-page');

      await fillSignInForm(page, 'lan.tran@spmet.edu.vn', 'TestPassword@123');

      // Wait for navigation or error
      try {
        await Promise.race([
          page.waitForURL(url => !url.includes('/sign-in'), { timeout: 5000 }),
          page.waitForTimeout(5000),
        ]);
      } catch {}

      await page.waitForTimeout(1500);
      const finalUrl = page.url();
      const succeeded = !finalUrl.includes('/sign-in');
      const correctRedirect = finalUrl.includes('/hospital/dashboard');
      const errorText = await findErrorMessage(page);

      console.log(`  Sign-in succeeded: ${succeeded}`);
      console.log(`  Final URL: ${finalUrl}`);
      console.log(`  Redirected to /hospital/dashboard: ${correctRedirect}`);
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
      console.log(`  Test error: ${err.message}`);
      await takeScreenshot(page, '01-error').catch(() => {});
      results.push({ test: 'Hospital user', succeeded: false, error: err.message });
    }
    await context.close();
  }

  // ── TEST 2: Admin user ────────────────────────────────────────────────────
  console.log('\n=== TEST 2: Admin user (admin@medilink.vn / TestPassword@123) ===');
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
      await fillSignInForm(page, 'admin@medilink.vn', 'TestPassword@123');

      try {
        await Promise.race([
          page.waitForURL(url => !url.includes('/sign-in'), { timeout: 5000 }),
          page.waitForTimeout(5000),
        ]);
      } catch {}

      await page.waitForTimeout(1500);
      const finalUrl = page.url();
      const succeeded = !finalUrl.includes('/sign-in');
      const correctRedirect = finalUrl.includes('/admin/dashboard');
      const errorText = await findErrorMessage(page);

      console.log(`  Sign-in succeeded: ${succeeded}`);
      console.log(`  Final URL: ${finalUrl}`);
      console.log(`  Redirected to /admin/dashboard: ${correctRedirect}`);
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
      console.log(`  Test error: ${err.message}`);
      await takeScreenshot(page, '02-error').catch(() => {});
      results.push({ test: 'Admin user', succeeded: false, error: err.message });
    }
    await context.close();
  }

  // ── TEST 3: Provider user ─────────────────────────────────────────────────
  console.log('\n=== TEST 3: Provider user (minh.le@techmed.vn / TestPassword@123) ===');
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
      await fillSignInForm(page, 'minh.le@techmed.vn', 'TestPassword@123');

      try {
        await Promise.race([
          page.waitForURL(url => !url.includes('/sign-in'), { timeout: 5000 }),
          page.waitForTimeout(5000),
        ]);
      } catch {}

      await page.waitForTimeout(1500);
      const finalUrl = page.url();
      const succeeded = !finalUrl.includes('/sign-in');
      const correctRedirect = finalUrl.includes('/provider/dashboard');
      const errorText = await findErrorMessage(page);

      console.log(`  Sign-in succeeded: ${succeeded}`);
      console.log(`  Final URL: ${finalUrl}`);
      console.log(`  Redirected to /provider/dashboard: ${correctRedirect}`);
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
      console.log(`  Test error: ${err.message}`);
      await takeScreenshot(page, '03-error').catch(() => {});
      results.push({ test: 'Provider user', succeeded: false, error: err.message });
    }
    await context.close();
  }

  // ── TEST 4: Invalid credentials ───────────────────────────────────────────
  console.log('\n=== TEST 4: Invalid credentials (wrong@test.com / wrongpass) ===');
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });
      await fillSignInForm(page, 'wrong@test.com', 'wrongpass');

      // Wait for error message to appear
      await page.waitForTimeout(3000);

      const finalUrl = page.url();
      const stayedOnSignIn = finalUrl.includes('/sign-in');
      const errorText = await findErrorMessage(page);

      // Also get any text that might show an error
      const allText = await page.textContent('body');
      const hasErrorKeywords = /invalid|incorrect|wrong|error|not found|credentials/i.test(allText);

      console.log(`  Stayed on sign-in page (expected): ${stayedOnSignIn}`);
      console.log(`  Final URL: ${finalUrl}`);
      console.log(`  Error message found: ${errorText || '(check screenshot)'}`);
      console.log(`  Page contains error keywords: ${hasErrorKeywords}`);

      await takeScreenshot(page, '04-invalid-credentials');

      results.push({
        test: 'Invalid credentials (wrong@test.com)',
        succeeded: false,
        stayedOnSignIn,
        finalUrl,
        errorText: errorText || '(see screenshot - no specific error element found)',
      });
    } catch (err) {
      console.log(`  Test error: ${err.message}`);
      await takeScreenshot(page, '04-error').catch(() => {});
      results.push({ test: 'Invalid credentials', succeeded: false, error: err.message });
    }
    await context.close();
  }

  await browser.close();

  // ── FINAL SUMMARY ─────────────────────────────────────────────────────────
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                     FINAL TEST SUMMARY                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  for (const r of results) {
    console.log(`\n── ${r.test} ──`);
    console.log(`   Sign-in succeeded    : ${r.succeeded}`);
    console.log(`   Final URL            : ${r.finalUrl || 'N/A'}`);
    if (r.expectedRedirect !== undefined) {
      console.log(`   Expected redirect    : ${r.expectedRedirect}`);
      console.log(`   Correct redirect     : ${r.correctRedirect}`);
    }
    if (r.stayedOnSignIn !== undefined) {
      console.log(`   Stayed on sign-in   : ${r.stayedOnSignIn} (expected: true for invalid)`);
    }
    if (r.errorText) {
      console.log(`   Error shown         : ${r.errorText}`);
    }
    if (r.error) {
      console.log(`   Script error        : ${r.error}`);
    }
  }

  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('Files:');
  fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => console.log(`  - ${SCREENSHOT_DIR}/${f}`));
}

runTests().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
