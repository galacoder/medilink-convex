/**
 * Tests for production environment validation utility.
 *
 * WHY: Missing environment variables in production cause silent failures
 * or confusing errors at runtime. The validation script should catch
 * missing required vars at startup (before serving traffic), fail fast
 * with clear error messages, and list all missing vars in one shot.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EnvValidationResult } from "../env-validation";
import { validateProductionEnv } from "../env-validation";

describe("validateProductionEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    // Start with a clean env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns valid:true when all required vars are present", () => {
    // Set all required production env vars
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://happy-otter-123.convex.cloud";
    process.env.AUTH_SECRET = "supersecretvalue123456789012345678901234";
    process.env.CONVEX_DEPLOYMENT = "prod:happy-otter-123";
    process.env.NEXT_PUBLIC_APP_VERSION = "1.0.0";

    const result = validateProductionEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("returns valid:false when NEXT_PUBLIC_CONVEX_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    process.env.AUTH_SECRET = "supersecretvalue";
    process.env.CONVEX_DEPLOYMENT = "prod:happy-otter-123";

    const result = validateProductionEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("NEXT_PUBLIC_CONVEX_URL");
  });

  it("returns valid:false when AUTH_SECRET is missing", () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://happy-otter-123.convex.cloud";
    delete process.env.AUTH_SECRET;
    process.env.CONVEX_DEPLOYMENT = "prod:happy-otter-123";

    const result = validateProductionEnv();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("AUTH_SECRET");
  });

  it("reports all missing vars in a single call", () => {
    // Remove all required vars
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    delete process.env.AUTH_SECRET;
    delete process.env.CONVEX_DEPLOYMENT;

    const result: EnvValidationResult = validateProductionEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(1);
  });

  it("returns an error summary string when validation fails", () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    process.env.AUTH_SECRET = "supersecretvalue";
    process.env.CONVEX_DEPLOYMENT = "prod:happy-otter-123";

    const result = validateProductionEnv();
    expect(result.errorSummary).toBeTruthy();
    expect(result.errorSummary).toContain("NEXT_PUBLIC_CONVEX_URL");
  });

  it("errorSummary is empty string when validation passes", () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://happy-otter-123.convex.cloud";
    process.env.AUTH_SECRET = "supersecretvalue";
    process.env.CONVEX_DEPLOYMENT = "prod:happy-otter-123";

    const result = validateProductionEnv();
    expect(result.errorSummary).toBe("");
  });
});
