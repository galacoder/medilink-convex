/**
 * MediLink Sign-in Trace
 * Signs in, then manually calls /api/auth/init to see what it returns
 */

const { chromium } = require('/home/sangle/dev/medilink-convex/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = '/tmp/medilink-signin-trace';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function testSignInAndTrace(email, password, testName) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  console.log(`\n[${testName}] ${email}`);
  console.log('  Step 1: Navigate to sign-in page...');
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 });

  console.log('  Step 2: Fill form and submit...');
  await page.waitForSelector('#email', { timeout: 5000 });
  await page.fill('#email', email);
  await page.fill('#password', password);

  // Wait for submit and session cookies to be set
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/auth/sign-in'), { timeout: 10000 }),
    page.click('button[type="submit"]'),
  ]).catch(() => [null]);

  if (response) {
    console.log(`  Auth API response status: ${response.status()}`);
    try {
      const body = await response.json();
      console.log(`  Auth API response body: ${JSON.stringify(body).slice(0, 200)}`);
    } catch {}
  }

  // Wait for cookies to be set
  await page.waitForTimeout(1000);

  // Check cookies
  const cookies = await ctx.cookies();
  const sessionToken = cookies.find(c => c.name === 'better-auth.session_token');
  const convexJwt = cookies.find(c => c.name === 'better-auth.convex_jwt');
  const orgContext = cookies.find(c => c.name === 'medilink-org-context');

  console.log(`  Session token: ${sessionToken ? 'SET' : 'NOT SET'}`);
  console.log(`  Convex JWT: ${convexJwt ? 'SET' : 'NOT SET'}`);
  console.log(`  Org context cookie: ${orgContext ? `SET (${orgContext.value})` : 'NOT SET'}`);

  if (!sessionToken || !convexJwt) {
    console.log('  FAIL: Sign-in did not set required cookies');
    await browser.close();
    return;
  }

  // Step 3: Manually fetch /api/auth/init while carrying all cookies
  console.log('  Step 3: Calling /api/auth/init directly...');

  const initResult = await page.evaluate(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/auth/init`, {
      redirect: 'manual',
      credentials: 'include',
    });
    return {
      status: res.status,
      statusText: res.statusText,
      location: res.headers.get('location'),
      type: res.type,
    };
  }, BASE_URL);

  console.log(`  /api/auth/init response:`);
  console.log(`    Status: ${initResult.status} ${initResult.statusText}`);
  console.log(`    Type: ${initResult.type}`);
  console.log(`    Location: ${initResult.location ?? '(none)'}`);

  // Step 4: Follow the redirect manually
  if (initResult.status >= 300 && initResult.status < 400 && initResult.location) {
    console.log(`  Step 4: Following redirect to ${initResult.location}...`);
    await page.goto(initResult.location.startsWith('http') ? initResult.location : `${BASE_URL}${initResult.location}`, {
      waitUntil: 'networkidle',
      timeout: 10000,
    });

    const finalUrl = page.url();
    console.log(`  Final URL after manual /api/auth/init: ${finalUrl}`);

    const cookiesAfter = await ctx.cookies();
    const orgContextAfter = cookiesAfter.find(c => c.name === 'medilink-org-context');
    console.log(`  Org context after init: ${orgContextAfter ? orgContextAfter.value : 'NOT SET'}`);
  }

  // Step 5: Check /api/org/context
  console.log('  Step 5: Calling /api/org/context...');
  const orgContextResult = await page.evaluate(async (baseUrl) => {
    try {
      const res = await fetch(`${baseUrl}/api/org/context`, {
        credentials: 'include',
      });
      const body = await res.text();
      return { status: res.status, body: body.slice(0, 300) };
    } catch (e) {
      return { error: e.message };
    }
  }, BASE_URL);

  console.log(`  /api/org/context: status=${orgContextResult.status}, body=${orgContextResult.body ?? orgContextResult.error}`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${testName}.png`), fullPage: true });

  await browser.close();
}

async function main() {
  console.log('=== MediLink Sign-in Trace ===');

  await testSignInAndTrace('lan.tran@spmet.edu.vn', 'TestPassword@123', 'hospital');
  await testSignInAndTrace('admin@medilink.vn', 'TestPassword@123', 'admin');
  await testSignInAndTrace('minh.le@techmed.vn', 'TestPassword@123', 'provider');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
