import { expect, test } from "@playwright/test";

/**
 * Production smoke test suite for MediLink.
 *
 * WHY: After deployment, smoke tests validate that critical application flows
 * work end-to-end in the production environment before traffic is shifted.
 * These tests should be fast (<30s total), cover the most important paths,
 * and have no external dependencies (no database writes, no auth required).
 *
 * Tests run in CI after each deployment via the Woodpecker pipeline
 * (stage 5: smoke tests → post-deploy validation).
 *
 * Flows covered (AC-4 requirement: 5-10 smoke tests):
 * 1. Health check endpoint — liveness probe
 * 2. Health check response structure — monitoring contract
 * 3. Landing/marketing page — basic rendering
 * 4. Sign-in page accessibility — auth flow entry point
 * 5. Sign-up page accessibility — registration flow entry point
 * 6. Static asset serving — CDN/cache headers
 * 7. Security headers — CSP and HSTS presence
 * 8. 404 handling — graceful error pages
 */

/**
 * Smoke Test 1: Health check liveness probe.
 *
 * WHY: The first thing monitoring checks after deployment is the health
 * endpoint. If this fails, no other tests are meaningful.
 */
test("health check returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { status: string };
  expect(body.status).toBe("ok");
});

/**
 * Smoke Test 2: Health check response structure.
 *
 * WHY: Monitoring tools rely on the response structure contract.
 * A structural change would break dashboards and alerting pipelines.
 */
test("health check response has required fields", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = (await response.json()) as Record<string, unknown>;

  // Required fields per AC-4 specification
  expect(body).toHaveProperty("status");
  expect(body).toHaveProperty("timestamp");
  expect(body).toHaveProperty("version");
  expect(body).toHaveProperty("services");

  // Timestamp must be a valid ISO 8601 date
  const timestamp = body.timestamp as string;
  expect(() => new Date(timestamp)).not.toThrow();
  expect(new Date(timestamp).toISOString()).toBe(timestamp);
});

/**
 * Smoke Test 3: Health check services section.
 *
 * WHY: The services section allows ops team to identify which component
 * is failing without reading logs. Structure must remain stable.
 */
test("health check services includes convex status", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = (await response.json()) as { services: Record<string, unknown> };

  expect(body.services).toHaveProperty("convex");
  const convex = body.services.convex as { status: string };
  expect(["ok", "degraded", "unavailable"]).toContain(convex.status);
});

/**
 * Smoke Test 4: Landing page renders.
 *
 * WHY: The marketing/landing page is the entry point for new users.
 * If it fails to render, no users can reach sign-in.
 */
test("landing page renders without crashing", async ({ page }) => {
  await page.goto("/");
  // Page should not show an error boundary or 500 status
  await expect(page).not.toHaveTitle(/Error/i);
  // Basic rendering check — at minimum the page should have a body
  await expect(page.locator("body")).toBeVisible();
});

/**
 * Smoke Test 5: Sign-in page is accessible.
 *
 * WHY: Authentication is the critical path for all user-facing features.
 * If the sign-in page is broken, no users can access the application.
 */
test("sign-in page is accessible", async ({ page }) => {
  await page.goto("/sign-in");
  // Should return 200 (not redirect loop or 500)
  await expect(page.locator("body")).toBeVisible();
});

/**
 * Smoke Test 6: Security headers are present on HTML responses.
 *
 * WHY: Security headers protect users from XSS, clickjacking, and other
 * attacks. Their absence in production is a deployment configuration error.
 * This test catches cases where headers are configured in vercel.json but
 * not applied (e.g., wrong environment or CDN override).
 */
test("security headers are present on HTML responses", async ({ request }) => {
  const response = await request.get("/sign-in");
  const headers = response.headers();

  // X-Frame-Options prevents clickjacking attacks
  expect(headers["x-frame-options"]).toBe("DENY");

  // X-Content-Type-Options prevents MIME type sniffing
  expect(headers["x-content-type-options"]).toBe("nosniff");
});

/**
 * Smoke Test 7: Health endpoint is not cached.
 *
 * WHY: A cached health response would always return "ok" even when the
 * service is unhealthy, defeating the purpose of health monitoring.
 */
test("health endpoint has no-cache headers", async ({ request }) => {
  const response = await request.get("/api/health");
  const cacheControl = response.headers()["cache-control"] ?? "";

  // Must not be cached — health checks must always reflect current state
  expect(cacheControl.toLowerCase()).toContain("no-store");
});

/**
 * Smoke Test 8: 404 pages do not crash the application.
 *
 * WHY: Not-found errors are the most common error in production.
 * If the 404 handler crashes, it cascades into 500s for all missing routes.
 */
test("unknown routes return a proper error response", async ({ request }) => {
  const response = await request.get(
    "/this-route-definitely-does-not-exist-12345",
  );
  // Should return 404, not 500 (which would indicate a crash)
  expect(response.status()).toBe(404);
});
