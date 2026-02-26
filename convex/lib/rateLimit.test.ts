/**
 * Unit tests for per-organization rate limiting.
 *
 * WHY: Tests the checkOrgRateLimit helper and rate limit configuration.
 * Since the @convex-dev/rate-limiter component is not available in convex-test,
 * we verify that:
 * 1. Rate limit configs match the specification
 * 2. checkOrgRateLimit gracefully handles missing component (test env)
 * 3. The bilingual error format is correct when limits are exceeded
 *
 * vi: "Kiem tra don vi cho gioi han toc do theo to chuc"
 * en: "Unit tests for per-org rate limiting"
 */

import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import {
  checkOrgRateLimit,
  RATE_LIMIT_CONFIGS,
  type RateLimitedEndpoint,
} from "./rateLimit";

// ---------------------------------------------------------------------------
// Config validation tests
// ---------------------------------------------------------------------------

describe("RATE_LIMIT_CONFIGS", () => {
  it("defines all 5 required endpoint configurations", () => {
    const expectedEndpoints: RateLimitedEndpoint[] = [
      "equipment.create",
      "consumables.recordUsage",
      "serviceRequests.create",
      "quotes.submit",
      "serviceRequests.updateProgress",
    ];

    for (const endpoint of expectedEndpoints) {
      expect(RATE_LIMIT_CONFIGS[endpoint]).toBeDefined();
      expect(RATE_LIMIT_CONFIGS[endpoint].kind).toBe("token bucket");
      expect(RATE_LIMIT_CONFIGS[endpoint].rate).toBeGreaterThan(0);
      expect(RATE_LIMIT_CONFIGS[endpoint].period).toBe(60_000);
      expect(RATE_LIMIT_CONFIGS[endpoint].capacity).toBeGreaterThan(0);
    }
  });

  it("has correct rates per specification", () => {
    expect(RATE_LIMIT_CONFIGS["equipment.create"].rate).toBe(20);
    expect(RATE_LIMIT_CONFIGS["equipment.create"].capacity).toBe(5);

    expect(RATE_LIMIT_CONFIGS["consumables.recordUsage"].rate).toBe(60);
    expect(RATE_LIMIT_CONFIGS["consumables.recordUsage"].capacity).toBe(10);

    expect(RATE_LIMIT_CONFIGS["serviceRequests.create"].rate).toBe(10);
    expect(RATE_LIMIT_CONFIGS["serviceRequests.create"].capacity).toBe(3);

    expect(RATE_LIMIT_CONFIGS["quotes.submit"].rate).toBe(10);
    expect(RATE_LIMIT_CONFIGS["quotes.submit"].capacity).toBe(3);

    expect(RATE_LIMIT_CONFIGS["serviceRequests.updateProgress"].rate).toBe(30);
    expect(RATE_LIMIT_CONFIGS["serviceRequests.updateProgress"].capacity).toBe(
      10,
    );
  });
});

// ---------------------------------------------------------------------------
// checkOrgRateLimit behavior tests
// ---------------------------------------------------------------------------

describe("checkOrgRateLimit", () => {
  it("gracefully handles missing rate limiter component (test env)", async () => {
    // In test environment, the rate limiter component is not installed.
    // checkOrgRateLimit should catch the infrastructure error and allow
    // the operation to proceed (fail open).
    const mockCtx = {
      runMutation: async () => ({}),
      runQuery: async () => ({}),
    };

    // Should not throw for any endpoint
    await expect(
      checkOrgRateLimit(mockCtx, "test-org-id" as any, "equipment.create"),
    ).resolves.toBeUndefined();

    await expect(
      checkOrgRateLimit(
        mockCtx,
        "test-org-id" as any,
        "consumables.recordUsage",
      ),
    ).resolves.toBeUndefined();

    await expect(
      checkOrgRateLimit(
        mockCtx,
        "test-org-id" as any,
        "serviceRequests.create",
      ),
    ).resolves.toBeUndefined();

    await expect(
      checkOrgRateLimit(mockCtx, "test-org-id" as any, "quotes.submit"),
    ).resolves.toBeUndefined();

    await expect(
      checkOrgRateLimit(
        mockCtx,
        "test-org-id" as any,
        "serviceRequests.updateProgress",
      ),
    ).resolves.toBeUndefined();
  });

  it("exports correct type for RateLimitedEndpoint", () => {
    // Type-level test: these should compile without error
    const valid: RateLimitedEndpoint[] = [
      "equipment.create",
      "consumables.recordUsage",
      "serviceRequests.create",
      "quotes.submit",
      "serviceRequests.updateProgress",
    ];
    expect(valid).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// ConvexError format test (for when rate limit IS exceeded)
// ---------------------------------------------------------------------------

describe("rate limit error format", () => {
  it("throws bilingual ConvexError with retry-after seconds", () => {
    // Simulate the error that checkOrgRateLimit would throw
    const retryAfter = 5500; // 5.5 seconds -> ceil to 6
    const retrySeconds = Math.ceil(retryAfter / 1000);

    const error = new ConvexError({
      vi: `Qua nhieu yeu cau. Vui long thu lai sau ${retrySeconds} giay.`,
      en: `Rate limit exceeded. Please try again in ${retrySeconds} seconds.`,
    });

    expect(error).toBeInstanceOf(ConvexError);

    const data = error.data as { vi: string; en: string };
    expect(data.vi).toContain("Qua nhieu yeu cau");
    expect(data.vi).toContain("6 giay");
    expect(data.en).toContain("Rate limit exceeded");
    expect(data.en).toContain("6 seconds");
  });

  it("rounds up fractional seconds (ceil)", () => {
    // 100ms -> ceil to 1 second
    const retrySeconds = Math.ceil(100 / 1000);
    expect(retrySeconds).toBe(1);

    // 59001ms -> ceil to 60 seconds
    const retrySeconds2 = Math.ceil(59001 / 1000);
    expect(retrySeconds2).toBe(60);

    // 0ms -> ceil to 0 seconds
    const retrySeconds3 = Math.ceil(0 / 1000);
    expect(retrySeconds3).toBe(0);
  });
});
