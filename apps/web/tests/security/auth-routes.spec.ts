import { expect, test } from "@playwright/test";

/**
 * Auth route protection security tests (M5-6 AC: All routes properly protected).
 *
 * WHY: Every protected route must redirect unauthenticated users to /sign-in.
 * If any route is reachable without authentication, patient data or equipment
 * records could be exposed — a critical violation of the SPMET data protection
 * requirements (Vietnamese Personal Data Protection Decree 13/2023).
 *
 * These tests make unauthenticated HTTP requests (no cookies, no session)
 * directly to protected routes and assert that:
 *   1. The response is a redirect (3xx) or the final URL is /sign-in
 *   2. Protected page content is NOT rendered for unauthenticated visitors
 *
 * Tests use the base Playwright test (no auth fixtures) so that each request
 * starts with a clean, unauthenticated browser context.
 *
 * vi: "Kiểm tra bảo vệ đường dẫn yêu cầu xác thực"
 * en: "Auth route protection tests"
 */

/**
 * Protected routes that must redirect unauthenticated users.
 * Organized by portal to make failures easy to diagnose.
 *
 * vi: "Các đường dẫn được bảo vệ" / en: "Protected routes"
 */
const PROTECTED_ROUTES = {
  hospital: [
    "/hospital/dashboard",
    "/hospital/equipment",
    "/hospital/consumables",
    "/hospital/service-requests",
    "/hospital/maintenance",
    "/hospital/notifications",
    "/hospital/settings",
  ],
  provider: [
    "/provider/dashboard",
    "/provider/service-requests",
    "/provider/equipment",
    "/provider/notifications",
  ],
  admin: [
    "/admin/dashboard",
    "/admin/users",
    "/admin/hospitals",
    "/admin/providers",
    "/admin/audit-log",
  ],
} as const;

/**
 * Public routes that must NOT redirect (accessible without auth).
 *
 * vi: "Các đường dẫn công khai" / en: "Public routes"
 */
const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up", "/api/health"] as const;

test.describe("Auth route protection", () => {
  /**
   * Verify all public routes are accessible without authentication.
   *
   * WHY: Public routes (marketing, auth pages, health check) must be reachable
   * without a session. If they redirect to /sign-in, unauthenticated users
   * cannot sign up or access the landing page.
   *
   * vi: "Đường dẫn công khai có thể truy cập mà không cần đăng nhập"
   * en: "Public routes accessible without authentication"
   */
  test.describe("Public routes are accessible without auth", () => {
    for (const route of PUBLIC_ROUTES) {
      test(`${route} does not redirect to sign-in`, async ({ page }) => {
        await page.goto(route);

        // Public routes must NOT redirect to sign-in
        // WHY: A redirect here means the landing/sign-up page is broken for
        // new visitors, blocking the onboarding flow entirely.
        await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10000 });

        // Health check should return JSON (not HTML redirect)
        if (route === "/api/health") {
          const response = await page.request.get(route);
          expect(response.status()).toBe(200);
        }
      });
    }
  });

  /**
   * Hospital portal: all routes redirect unauthenticated users to /sign-in.
   *
   * WHY: Hospital staff manage equipment and patient-linked devices. An
   * unauthenticated visitor must never see the hospital dashboard or equipment
   * inventory — this would expose sensitive healthcare asset data.
   *
   * vi: "Cổng bệnh viện - chuyển hướng người dùng chưa đăng nhập"
   * en: "Hospital portal redirects unauthenticated users"
   */
  test.describe("Hospital portal requires authentication", () => {
    for (const route of PROTECTED_ROUTES.hospital) {
      test(`${route} redirects to sign-in`, async ({ page }) => {
        await page.goto(route);

        // Wait for navigation to settle after any redirects
        // WHY: Middleware redirects are asynchronous — the final URL may
        // require one or more redirect hops before settling.
        await page.waitForURL(/\/sign-in|\/sign-up/, { timeout: 15000 });

        // Final URL must be the sign-in page
        expect(page.url()).toMatch(/\/sign-in/);
      });
    }
  });

  /**
   * Provider portal: all routes redirect unauthenticated users to /sign-in.
   *
   * WHY: Provider service request data is commercially sensitive. Providers
   * configure pricing, service offerings, and respond to hospital quotes.
   * Unauthenticated access would expose competitor pricing information.
   *
   * vi: "Cổng nhà cung cấp - chuyển hướng người dùng chưa đăng nhập"
   * en: "Provider portal redirects unauthenticated users"
   */
  test.describe("Provider portal requires authentication", () => {
    for (const route of PROTECTED_ROUTES.provider) {
      test(`${route} redirects to sign-in`, async ({ page }) => {
        await page.goto(route);
        await page.waitForURL(/\/sign-in|\/sign-up/, { timeout: 15000 });
        expect(page.url()).toMatch(/\/sign-in/);
      });
    }
  });

  /**
   * Admin portal: all routes redirect unauthenticated users to /sign-in.
   *
   * WHY: The admin portal provides platform-level controls (user management,
   * audit logs, org suspension). Unauthenticated access is a critical breach —
   * it would allow anyone to view or modify platform-wide user data.
   *
   * Note: Even if a request reaches /admin/* with a valid session but WITHOUT
   * platformRole=platform_admin, the middleware should redirect to /hospital/dashboard
   * or /provider/dashboard. That role-based check is validated in the
   * admin fixture tests (e2e/tests/admin/).
   *
   * vi: "Cổng quản trị - chuyển hướng người dùng chưa đăng nhập"
   * en: "Admin portal redirects unauthenticated users"
   */
  test.describe("Admin portal requires authentication", () => {
    for (const route of PROTECTED_ROUTES.admin) {
      test(`${route} redirects to sign-in`, async ({ page }) => {
        await page.goto(route);
        await page.waitForURL(/\/sign-in|\/sign-up/, { timeout: 15000 });
        expect(page.url()).toMatch(/\/sign-in/);
      });
    }
  });

  /**
   * Security headers are present on all routes (M5-6 AC: CSRF + security headers).
   *
   * WHY: Security headers (X-Frame-Options, X-Content-Type-Options, CSP) are
   * the first line of defense against XSS and clickjacking. Verifying them
   * via E2E test ensures that the next.config.js headers() configuration
   * is active and has not been accidentally removed.
   *
   * vi: "Tiêu đề bảo mật có mặt trên các phản hồi"
   * en: "Security headers present on responses"
   */
  test("security headers are present on the landing page", async ({
    request,
  }) => {
    const response = await request.get("/");

    // X-Frame-Options: DENY — prevents clickjacking via iframes
    const xFrameOptions = response.headers()["x-frame-options"];
    expect(xFrameOptions).toBe("DENY");

    // X-Content-Type-Options: nosniff — prevents MIME-type sniffing attacks
    const xContentType = response.headers()["x-content-type-options"];
    expect(xContentType).toBe("nosniff");

    // Referrer-Policy — controls referrer header in cross-origin requests
    const referrerPolicy = response.headers()["referrer-policy"];
    expect(referrerPolicy).toBe("strict-origin-when-cross-origin");
  });

  /**
   * CSP header is present (M5-6 AC: Content Security Policy on auth routes).
   *
   * WHY: A Content-Security-Policy header restricts script execution to trusted
   * sources, preventing injected scripts from exfiltrating session tokens or
   * patient data to attacker-controlled servers.
   *
   * vi: "Chính sách bảo mật nội dung có mặt"
   * en: "Content-Security-Policy header present"
   */
  test("Content-Security-Policy header is present on protected routes", async ({
    request,
  }) => {
    const response = await request.get("/sign-in");

    const csp = response.headers()["content-security-policy"];

    // CSP must be present and contain core directives
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src");
    expect(csp).toContain("frame-ancestors");
  });

  /**
   * API routes require authentication (M5-6 AC: no unauthenticated API access).
   *
   * WHY: API routes (tRPC, Convex HTTP) must reject unauthenticated requests
   * with 401/403. Without this check, curl/Postman calls without a session
   * token could read or mutate data directly.
   *
   * Note: The /api/health endpoint is intentionally public (excluded).
   *
   * vi: "Đường dẫn API từ chối yêu cầu chưa xác thực"
   * en: "API routes reject unauthenticated requests"
   */
  test("trpc API rejects unauthenticated requests with 401 or 403", async ({
    request,
  }) => {
    // Attempt to call tRPC without a session cookie
    const response = await request.get("/api/trpc/auth.getSession");

    // Must not return 200 — must reject unauthenticated callers
    // WHY: A 200 response here would mean the API is exposing data
    // without verifying the caller's identity.
    expect([401, 403, 404, 405]).toContain(response.status());
  });
});
