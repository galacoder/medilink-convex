import { expect, test } from "@playwright/test";

/**
 * Smoke test: verifies the /api/health endpoint returns {status: "ok"}.
 *
 * WHY: This test validates that Playwright infrastructure is correctly
 * configured and the Next.js dev server is reachable before any
 * real E2E tests run. If this fails, the test runner or server setup
 * has a problem — not the application logic.
 */
test("health check returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { status: string };
  expect(body.status).toBe("ok");
});
