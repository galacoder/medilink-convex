/**
 * Tests for Content Security Policy (CSP) header generation.
 *
 * WHY: CSP headers are the primary defense against XSS attacks on free-text
 * fields stored in Convex. These tests verify nonce generation, directive
 * correctness, and dev/prod mode differences.
 */
import { describe, expect, it, vi } from "vitest";

import { buildCspHeader, generateNonce } from "./csp";

// ---------------------------------------------------------------------------
// generateNonce
// ---------------------------------------------------------------------------

describe("generateNonce", () => {
  it("returns a base64-encoded string", () => {
    const nonce = generateNonce();
    // Base64 alphabet: A-Z, a-z, 0-9, +, /, and = padding
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("returns unique values on successive calls", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// buildCspHeader
// ---------------------------------------------------------------------------

describe("buildCspHeader", () => {
  const TEST_NONCE = "dGVzdC1ub25jZQ=="; // base64("test-nonce")

  it("includes nonce in script-src directive", () => {
    const csp = buildCspHeader(TEST_NONCE, false);
    expect(csp).toContain(`'nonce-${TEST_NONCE}'`);
  });

  it("includes strict-dynamic in script-src", () => {
    const csp = buildCspHeader(TEST_NONCE, false);
    expect(csp).toContain("'strict-dynamic'");
  });

  it("includes nonce in style-src directive", () => {
    const csp = buildCspHeader(TEST_NONCE, false);
    expect(csp).toContain(`style-src 'self' 'nonce-${TEST_NONCE}'`);
  });

  it("blocks object embeds via object-src 'none'", () => {
    const csp = buildCspHeader(TEST_NONCE, false);
    expect(csp).toContain("object-src 'none'");
  });

  it("restricts base-uri to self", () => {
    const csp = buildCspHeader(TEST_NONCE, false);
    expect(csp).toContain("base-uri 'self'");
  });

  it("blocks framing via frame-ancestors 'none'", () => {
    const csp = buildCspHeader(TEST_NONCE, false);
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("does NOT include unsafe-eval in production mode", () => {
    const csp = buildCspHeader(TEST_NONCE, false);
    expect(csp).not.toContain("unsafe-eval");
  });

  it("includes unsafe-eval in development mode for HMR", () => {
    const csp = buildCspHeader(TEST_NONCE, true);
    expect(csp).toContain("'unsafe-eval'");
  });

  it("joins directives with semicolons", () => {
    const csp = buildCspHeader(TEST_NONCE, false);
    // Should contain multiple semicolons separating directives
    const directives = csp.split("; ");
    expect(directives.length).toBeGreaterThanOrEqual(5);
  });

  it("default-src is set to self", () => {
    const csp = buildCspHeader(TEST_NONCE, false);
    expect(csp).toContain("default-src 'self'");
  });
});
