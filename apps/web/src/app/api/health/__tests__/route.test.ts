/**
 * Tests for the /api/health endpoint.
 *
 * WHY: The health check endpoint is the primary liveness probe for production
 * monitoring and smoke test suites. Tests verify the JSON structure contract
 * so that monitoring tools can rely on a stable response shape.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// We test the GET handler in isolation by importing it directly.
// This avoids spinning up a Next.js server for unit tests.
vi.mock("~/env", () => ({
  env: {
    NODE_ENV: "test",
    NEXT_PUBLIC_CONVEX_URL: "https://test.convex.cloud",
    NEXT_PUBLIC_CONVEX_SITE_URL: undefined,
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
  },
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub AUTH_SECRET via process.env since it is a server-side var
    // not included in the ~/env client schema.
    vi.stubEnv("AUTH_SECRET", "test-secret-value");
  });

  it("returns 200 with status ok", async () => {
    const { GET } = await import("../route");
    const response = GET();
    expect(response.status).toBe(200);
  });

  it("returns JSON with required fields", async () => {
    const { GET } = await import("../route");
    const response = GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("services");
  });

  it("returns status ok when all services healthy", async () => {
    const { GET } = await import("../route");
    const response = GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(body.status).toBe("ok");
  });

  it("returns a valid ISO 8601 timestamp", async () => {
    const { GET } = await import("../route");
    const response = GET();
    const body = (await response.json()) as Record<string, unknown>;

    // Verify timestamp is a valid ISO 8601 date string
    const timestamp = body.timestamp as string;
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it("returns services object with convex field", async () => {
    const { GET } = await import("../route");
    const response = GET();
    const body = (await response.json()) as {
      services: Record<string, unknown>;
    };

    expect(body.services).toHaveProperty("convex");
  });

  it("returns version from environment", async () => {
    const { GET } = await import("../route");
    const response = GET();
    const body = (await response.json()) as Record<string, unknown>;

    // Version should be a string (from env or 'unknown')
    expect(typeof body.version).toBe("string");
  });
});
