/**
 * Test script: Convex UNAUTHENTICATED race condition check
 *
 * WHY: Verifies that MediLink dashboards load cleanly without Convex
 * UNAUTHENTICATED errors after sign-in, for all three user roles.
 *
 * Run: node scripts/test-unauthenticated-race.mjs
 */

import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = "http://localhost:3002";
const SCREENSHOT_DIR = join(__dirname, "screenshots");

const TESTS = [
  {
    name: "Test 1 - Hospital dashboard (lan.tran)",
    email: "lan.tran@spmet.edu.vn",
    password: "TestPassword@123",
    screenshotFile: "test1-hospital.png",
  },
  {
    name: "Test 2 - Admin dashboard (admin@medilink.vn)",
    email: "admin@medilink.vn",
    password: "TestPassword@123",
    screenshotFile: "test2-admin.png",
  },
  {
    name: "Test 3 - Provider dashboard (minh.le@techmed.vn)",
    email: "minh.le@techmed.vn",
    password: "TestPassword@123",
    screenshotFile: "test3-provider.png",
  },
];

async function runTest(browser, testConfig) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${testConfig.name}`);
  console.log(`${"=".repeat(60)}`);

  // Fresh browser context for isolation
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const consoleErrors = [];
  const networkErrors = [];

  const page = await context.newPage();

  // Capture console errors/warnings
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      const text = msg.text();
      consoleErrors.push({ type: msg.type(), text });
      if (
        text.includes("UNAUTHENTICATED") ||
        text.includes("ConvexError") ||
        text.includes("Convex") ||
        text.includes("Error")
      ) {
        console.log(`  [CONSOLE ${msg.type().toUpperCase()}]: ${text}`);
      }
    }
  });

  // Capture page errors (uncaught exceptions)
  page.on("pageerror", (err) => {
    console.log(`  [PAGE ERROR]: ${err.message}`);
    networkErrors.push(err.message);
  });

  try {
    // Step 1: Navigate to sign-in
    console.log(`  -> Navigating to ${BASE_URL}/sign-in`);
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "networkidle" });
    console.log(`  -> Current URL: ${page.url()}`);

    // Step 2: Fill email
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.fill(testConfig.email);
    console.log(`  -> Filled email: ${testConfig.email}`);

    // Step 3: Fill password
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );
    await passwordInput.fill(testConfig.password);
    console.log(`  -> Filled password`);

    // Step 4: Submit form
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Sign in"), button:has-text("Đăng nhập")'
    );
    await submitButton.click();
    console.log(`  -> Clicked sign-in button`);

    // Step 5: Wait up to 8 seconds for redirect chain
    try {
      await page.waitForURL(
        (url) => !url.toString().includes("/sign-in"),
        { timeout: 8000 }
      );
      console.log(`  -> Redirected to: ${page.url()}`);
    } catch {
      console.log(`  -> No redirect after 8s, current URL: ${page.url()}`);
    }

    // Step 6: Wait additional 3 seconds for page to fully render
    console.log(`  -> Waiting 3 seconds for page to settle...`);
    await page.waitForTimeout(3000);

    const finalURL = page.url();
    console.log(`  -> Final URL: ${finalURL}`);

    // Step 7: Take screenshot
    const screenshotPath = join(SCREENSHOT_DIR, testConfig.screenshotFile);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  -> Screenshot saved: ${screenshotPath}`);

    // Step 8: Check for error overlays / UNAUTHENTICATED text
    const pageContent = await page.content();
    const pageText = await page.evaluate(() => document.body?.innerText ?? "");

    const errorPatterns = [
      "UNAUTHENTICATED",
      "ConvexError",
      "Not authenticated",
      "Unauthenticated",
      "Error overlay",
      "Application error",
      "Unhandled Runtime Error",
      "__NEXT_ERROR__",
    ];

    const foundErrors = [];
    for (const pattern of errorPatterns) {
      if (pageText.includes(pattern) || pageContent.includes(pattern)) {
        foundErrors.push(pattern);
      }
    }

    // Check for Next.js error overlay specifically
    const hasNextErrorOverlay = await page
      .locator("nextjs-portal, [data-nextjs-dialog], [data-nextjs-toast]")
      .count();

    const hasErrorDialog = await page
      .locator('[role="dialog"]:has-text("Error"), [role="alertdialog"]')
      .count();

    // Determine pass/fail
    const hasErrors =
      foundErrors.length > 0 || hasNextErrorOverlay > 0 || hasErrorDialog > 0;

    console.log(`\n  RESULTS:`);
    console.log(`  Final URL: ${finalURL}`);
    console.log(
      `  Error patterns found in page text: ${foundErrors.length > 0 ? foundErrors.join(", ") : "none"}`
    );
    console.log(
      `  Next.js error overlay elements: ${hasNextErrorOverlay}`
    );
    console.log(`  Error dialog elements: ${hasErrorDialog}`);
    console.log(
      `  Console errors (Convex/Auth related): ${consoleErrors.filter((e) => e.text.includes("UNAUTHENTICATED") || e.text.includes("Convex") || e.text.includes("ConvexError")).length}`
    );

    const result = hasErrors ? "FAIL" : "PASS";
    console.log(`\n  *** ${result} ***`);

    return {
      name: testConfig.name,
      result,
      finalURL,
      foundErrors,
      hasNextErrorOverlay,
      hasErrorDialog,
      consoleErrors: consoleErrors.filter(
        (e) =>
          e.text.includes("UNAUTHENTICATED") ||
          e.text.includes("Convex") ||
          e.text.includes("ConvexError") ||
          e.text.includes("Error")
      ),
      screenshotPath,
    };
  } catch (err) {
    console.log(`  [EXCEPTION]: ${err.message}`);
    const screenshotPath = join(SCREENSHOT_DIR, testConfig.screenshotFile);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    return {
      name: testConfig.name,
      result: "FAIL",
      finalURL: page.url(),
      error: err.message,
      screenshotPath,
    };
  } finally {
    await context.close();
  }
}

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  console.log("MediLink UNAUTHENTICATED Race Condition Test");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = [];

  for (const testConfig of TESTS) {
    const result = await runTest(browser, testConfig);
    results.push(result);
  }

  await browser.close();

  // Summary report
  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY REPORT");
  console.log(`${"=".repeat(60)}`);

  for (const r of results) {
    const icon = r.result === "PASS" ? "PASS" : "FAIL";
    console.log(`\n[${icon}] ${r.name}`);
    console.log(`       URL: ${r.finalURL}`);
    if (r.foundErrors?.length > 0) {
      console.log(`       Errors: ${r.foundErrors.join(", ")}`);
    }
    if (r.error) {
      console.log(`       Exception: ${r.error}`);
    }
    console.log(`       Screenshot: ${r.screenshotPath}`);
  }

  const allPassed = results.every((r) => r.result === "PASS");
  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `OVERALL: ${allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}`
  );
  console.log(`${"=".repeat(60)}\n`);

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
