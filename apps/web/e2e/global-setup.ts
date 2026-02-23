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
 *   ./e2e/.auth/admin.json     — platform admin session (created here, set via HTTP endpoint)
 *
 * These files are consumed by auth fixtures in e2e/fixtures/auth.ts.
 *
 * Admin flow (special — no orgType selection):
 *   1. Sign up with any orgType (form requires it)
 *   2. Call Convex HTTP endpoint POST /api/admin/set-platform-role with shared secret
 *      to grant platform_admin role in both Better Auth user table and custom users table
 *   3. Sign out (clears session with no platformRole)
 *   4. Sign in again to get fresh session/JWT with platformRole
 *   5. Wait for proxy Branch 2 redirect to /admin/dashboard
 *   6. Save storageState
 *
 * Environment variables required for admin setup:
 *   NEXT_PUBLIC_CONVEX_SITE_URL — Convex HTTP site URL (e.g. https://<deploy>.convex.site)
 *   ADMIN_SETUP_SECRET — shared secret for the set-platform-role HTTP endpoint
 */
/**
 * Returns true if the auth fixture file exists and contains valid (non-empty) cookies.
 * WHY: Avoids re-running the 3-step sign-up flow when sessions are still active.
 * Better Auth session tokens have a long TTL (~30 days), so fixtures created in the
 * same dev session are reusable until they expire.
 */
function hasValidFixture(fs: typeof import("fs"), path: string): boolean {
  try {
    if (!fs.existsSync(path)) return false;
    const data = JSON.parse(fs.readFileSync(path, "utf-8")) as {
      cookies?: { name: string; expires: number }[];
    };
    if (!data.cookies || data.cookies.length === 0) return false;
    // Check session_token expiry (epoch seconds)
    const sessionCookie = data.cookies.find((c) =>
      c.name.includes("session_token"),
    );
    if (!sessionCookie) return false;
    return sessionCookie.expires > Date.now() / 1000;
  } catch {
    return false;
  }
}

async function globalSetup(_config: FullConfig): Promise<void> {
  const { chromium } = await import("@playwright/test");
  const fs = await import("fs");

  // Create .auth directory for storageState files
  fs.mkdirSync("./e2e/.auth", { recursive: true });

  // WHY: Respect PORT env var so local homelab runs (where port 3000 is
  // occupied by Dokploy) can point to the MediLink dev server on port 3002.
  // Set PORT=3002 when running: PORT=3002 pnpm e2e
  // eslint-disable-next-line no-restricted-properties
  const port = process.env.PORT ?? "3000";
  const baseURL = `http://localhost:${port}`;
  const timestamp = Date.now();

  // Skip sign-up flows if valid fixtures already exist.
  // WHY: Re-creating users requires a working Convex dev connection and takes ~30s.
  // Reusing existing fixtures is faster and avoids cluttering the Convex DB with
  // throwaway test accounts on every VRT run.
  const hospitalFixtureValid = hasValidFixture(fs, "./e2e/.auth/hospital.json");
  const providerFixtureValid = hasValidFixture(fs, "./e2e/.auth/provider.json");
  const adminFixtureValid = hasValidFixture(fs, "./e2e/.auth/admin.json");

  if (hospitalFixtureValid && providerFixtureValid && adminFixtureValid) {
    console.log(
      "[global-setup] Valid auth fixtures found (hospital + provider + admin) — skipping user creation. " +
        "Delete ./e2e/.auth/*.json to force re-creation.",
    );
    return;
  }

  if (hospitalFixtureValid && providerFixtureValid && !adminFixtureValid) {
    console.log(
      "[global-setup] Hospital and provider fixtures valid — skipping hospital/provider sign-up. " +
        "Running admin setup only.",
    );
    // Fall through to admin-only setup below
  }

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

  const ADMIN_USER = {
    name: "Platform Admin Test",
    email: `admin-${timestamp}@test.medilink.vn`,
    password: "TestPassword@123!",
    // Admin needs to fill the sign-up form which requires orgType + orgName.
    // We use hospital as a placeholder — the platformRole will override portal routing.
    orgType: "hospital" as const,
    orgName: `Admin Setup Org ${timestamp}`,
  };

  const browser = await chromium.launch();

  try {
    // --- Sign up hospital user (skip if valid fixture exists) ---
    if (!hospitalFixtureValid) {
      const hospitalContext = await browser.newContext();
      const hospitalPage = await hospitalContext.newPage();
      await hospitalPage.goto(`${baseURL}/sign-up`);
      await hospitalPage.fill("#name", HOSPITAL_USER.name);
      await hospitalPage.fill("#email", HOSPITAL_USER.email);
      await hospitalPage.fill("#password", HOSPITAL_USER.password);
      await hospitalPage.click(`#${HOSPITAL_USER.orgType}`);
      await hospitalPage.fill("#orgName", HOSPITAL_USER.orgName);
      await hospitalPage.click('button[type="submit"]');
      await hospitalPage.waitForURL("**/hospital/dashboard", {
        timeout: 20000,
      });
      await hospitalContext.storageState({ path: "./e2e/.auth/hospital.json" });
      await hospitalContext.close();
    }

    // --- Sign up provider user (skip if valid fixture exists) ---
    if (!providerFixtureValid) {
      const providerContext = await browser.newContext();
      const providerPage = await providerContext.newPage();
      await providerPage.goto(`${baseURL}/sign-up`);
      await providerPage.fill("#name", PROVIDER_USER.name);
      await providerPage.fill("#email", PROVIDER_USER.email);
      await providerPage.fill("#password", PROVIDER_USER.password);
      await providerPage.click(`#${PROVIDER_USER.orgType}`);
      await providerPage.fill("#orgName", PROVIDER_USER.orgName);
      await providerPage.click('button[type="submit"]');
      await providerPage.waitForURL("**/provider/dashboard", {
        timeout: 20000,
      });
      await providerContext.storageState({ path: "./e2e/.auth/provider.json" });
      await providerContext.close();
    }

    // --- Sign up admin user and grant platform_admin role (skip if valid fixture exists) ---
    // WHY: The admin flow requires:
    //   1. Create a Better Auth account via sign-up form (with placeholder org)
    //   2. Set platformRole via HTTP endpoint (requires ADMIN_SETUP_SECRET + CONVEX_SITE_URL)
    //   3. Re-authenticate to get fresh session with platformRole in the JWT
    //   4. Proxy Branch 2 routes admin to /admin/dashboard
    if (adminFixtureValid) {
      console.log(
        "[global-setup] Valid admin fixture found — skipping admin user creation.",
      );
    } else {
      /* eslint-disable no-restricted-properties */
      const nextPublicConvexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
      const convexSiteUrl =
        nextPublicConvexSiteUrl ?? process.env.CONVEX_SITE_URL;
      /* eslint-enable no-restricted-properties */
      // eslint-disable-next-line turbo/no-undeclared-env-vars, no-restricted-properties
      const adminSetupSecret = process.env.ADMIN_SETUP_SECRET;

      if (!convexSiteUrl || !adminSetupSecret) {
        console.warn(
          "[global-setup] Skipping admin user setup: NEXT_PUBLIC_CONVEX_SITE_URL and ADMIN_SETUP_SECRET must be set.\n" +
            "  Set these in .env.local to enable admin E2E tests.",
        );
        // Create empty placeholder so admin fixture doesn't crash
        fs.writeFileSync(
          "./e2e/.auth/admin.json",
          JSON.stringify({ cookies: [], origins: [] }),
        );
      } else {
        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();

        // Step 1: Sign up admin user via the standard form
        // The form requires orgType + orgName — we use hospital as placeholder
        await adminPage.goto(`${baseURL}/sign-up`);
        // WHY: Wait for the form to be ready before interacting. The sign-up page
        // is a Client Component that hydrates after initial page load, so we
        // wait for the name input to be visible before filling.
        await adminPage.waitForSelector("#name", {
          state: "visible",
          timeout: 60000,
        });
        await adminPage.fill("#name", ADMIN_USER.name);
        await adminPage.fill("#email", ADMIN_USER.email);
        await adminPage.fill("#password", ADMIN_USER.password);
        await adminPage.click(`#${ADMIN_USER.orgType}`);
        await adminPage.fill("#orgName", ADMIN_USER.orgName);
        await adminPage.click('button[type="submit"]');
        // After signup, the proxy routes based on orgType (hospital) -> hospital/dashboard
        // Then we sign out immediately — we just needed the Better Auth account created
        await adminPage.waitForURL("**/hospital/dashboard", { timeout: 20000 });

        // Step 2: Sign out to clear the hospital session cookie
        // WHY: We need a clean session before re-signing in with the admin role set
        await adminPage.goto(`${baseURL}/sign-out`);
        // Better Auth sign-out — use the API route
        await adminPage.request.post(`${baseURL}/api/auth/sign-out`, {
          headers: { "Content-Type": "application/json" },
        });
        // Navigate to sign-in to verify we're logged out
        await adminPage.goto(`${baseURL}/sign-in`);
        await adminPage
          .waitForURL(`${baseURL}/sign-in`, { timeout: 10000 })
          .catch(() => {
            // Some proxies might redirect — just continue
          });

        // Step 3: Call the Convex HTTP endpoint to set platformRole
        // WHY: The Better Auth session for this user currently has no platformRole.
        // Calling this endpoint updates BOTH our custom users table AND the
        // Better Auth user record (via betterAuth.adapter.updateMany), so that
        // the next sign-in will return platformRole in the session.
        const setPlatformRoleUrl = `${convexSiteUrl}/api/admin/set-platform-role`;
        const setPlatformRoleResponse = await adminPage.request.post(
          setPlatformRoleUrl,
          {
            headers: {
              "Content-Type": "application/json",
              "x-admin-setup-secret": adminSetupSecret,
            },
            data: JSON.stringify({
              email: ADMIN_USER.email,
              role: "platform_admin",
            }),
          },
        );

        if (!setPlatformRoleResponse.ok()) {
          const errorText = await setPlatformRoleResponse.text();
          throw new Error(
            `[global-setup] Failed to set platform role for admin user: ${errorText}`,
          );
        }

        // Step 4: Sign in again to get a fresh session with platformRole
        // WHY: The old session doesn't include platformRole. A fresh sign-in
        // will trigger a new JWT with the updated platformRole field,
        // which the proxy reads to route to /admin/dashboard.
        await adminPage.goto(`${baseURL}/sign-in`);
        await adminPage.fill("#email", ADMIN_USER.email);
        await adminPage.fill("#password", ADMIN_USER.password);
        await adminPage.click('button[type="submit"]');

        // Step 5: Wait for proxy to route admin to /admin/dashboard (Branch 2)
        // WHY: The proxy reads platformRole from Better Auth session and redirects
        // platform_admin users to /admin/dashboard.
        await adminPage.waitForURL("**/admin/dashboard", { timeout: 20000 });

        // Step 6: Save storageState for use by admin test fixtures
        await adminContext.storageState({ path: "./e2e/.auth/admin.json" });
        await adminContext.close();
      }
    } // end else (!adminFixtureValid)
  } finally {
    await browser.close();
  }

  // Store test user emails so tests can reference them if needed
  // eslint-disable-next-line turbo/no-undeclared-env-vars, no-restricted-properties
  process.env.HOSPITAL_USER_EMAIL = HOSPITAL_USER.email;
  // eslint-disable-next-line turbo/no-undeclared-env-vars, no-restricted-properties
  process.env.PROVIDER_USER_EMAIL = PROVIDER_USER.email;
  // eslint-disable-next-line turbo/no-undeclared-env-vars, no-restricted-properties
  process.env.ADMIN_USER_EMAIL = ADMIN_USER.email;
}

export default globalSetup;
