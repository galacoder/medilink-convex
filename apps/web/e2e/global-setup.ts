import type { FullConfig } from "@playwright/test";

/**
 * Global setup — creates authenticated browser storage states for reuse across tests.
 *
 * WHY: Signing up once in globalSetup and saving storageState prevents every test
 * from repeating the 3-step sign-up flow (signUp.email -> organization.create ->
 * organization.setActive), saving ~30 seconds per test.
 *
 * Storage state files saved to:
 *   ./e2e/.auth/hospital.json  — hospital user session
 *   ./e2e/.auth/provider.json  — provider user session
 *
 * These files are consumed by auth fixtures in e2e/fixtures/auth.ts.
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  const { chromium } = await import("@playwright/test");
  const fs = await import("fs");

  // Create .auth directory for storageState files
  fs.mkdirSync("./e2e/.auth", { recursive: true });

  const baseURL = "http://localhost:3000";
  const timestamp = Date.now();

  const HOSPITAL_USER = {
    name: "Hospital Test Staff",
    email: `hospital-${timestamp}@test.medilink.com`,
    password: "TestPassword@123",
    orgType: "hospital" as const,
    orgName: `SPMET Test Hospital ${timestamp}`,
  };

  const PROVIDER_USER = {
    name: "Provider Test Staff",
    email: `provider-${timestamp}@test.medilink.com`,
    password: "TestPassword@123",
    orgType: "provider" as const,
    orgName: `Medical Equipment Provider ${timestamp}`,
  };

  const browser = await chromium.launch();

  try {
    // --- Sign up hospital user ---
    const hospitalContext = await browser.newContext();
    const hospitalPage = await hospitalContext.newPage();
    await hospitalPage.goto(`${baseURL}/sign-up`);
    await hospitalPage.fill("#name", HOSPITAL_USER.name);
    await hospitalPage.fill("#email", HOSPITAL_USER.email);
    await hospitalPage.fill("#password", HOSPITAL_USER.password);
    await hospitalPage.click(`#${HOSPITAL_USER.orgType}`);
    await hospitalPage.fill("#orgName", HOSPITAL_USER.orgName);
    await hospitalPage.click('button[type="submit"]');
    await hospitalPage.waitForURL("**/hospital/dashboard", { timeout: 20000 });
    await hospitalContext.storageState({ path: "./e2e/.auth/hospital.json" });
    await hospitalContext.close();

    // --- Sign up provider user ---
    const providerContext = await browser.newContext();
    const providerPage = await providerContext.newPage();
    await providerPage.goto(`${baseURL}/sign-up`);
    await providerPage.fill("#name", PROVIDER_USER.name);
    await providerPage.fill("#email", PROVIDER_USER.email);
    await providerPage.fill("#password", PROVIDER_USER.password);
    await providerPage.click(`#${PROVIDER_USER.orgType}`);
    await providerPage.fill("#orgName", PROVIDER_USER.orgName);
    await providerPage.click('button[type="submit"]');
    await providerPage.waitForURL("**/provider/dashboard", { timeout: 20000 });
    await providerContext.storageState({ path: "./e2e/.auth/provider.json" });
    await providerContext.close();
  } finally {
    await browser.close();
  }

  // Store test user emails so tests can reference them if needed
  process.env.HOSPITAL_USER_EMAIL = HOSPITAL_USER.email;
  process.env.PROVIDER_USER_EMAIL = PROVIDER_USER.email;
}

export default globalSetup;
