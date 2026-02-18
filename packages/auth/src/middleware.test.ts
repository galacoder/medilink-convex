/**
 * Tests for auth middleware utilities.
 *
 * WHY: The isPublicPath and requiresAuth functions are the security boundary
 * gatekeeping all protected routes. These tests document and verify that
 * all expected public paths (including invite paths) bypass auth requirements.
 */
import { describe, expect, it } from "vitest";

import { isPublicPath, requiresAuth } from "./middleware";

// ---------------------------------------------------------------------------
// isPublicPath
// ---------------------------------------------------------------------------

describe("isPublicPath", () => {
  it("test_isPublicPath_root_returns_true", () => {
    expect(isPublicPath("/")).toBe(true);
  });

  it("test_isPublicPath_signIn_returns_true", () => {
    expect(isPublicPath("/sign-in")).toBe(true);
  });

  it("test_isPublicPath_signUp_returns_true", () => {
    expect(isPublicPath("/sign-up")).toBe(true);
  });

  it("test_isPublicPath_forgotPassword_returns_true", () => {
    expect(isPublicPath("/forgot-password")).toBe(true);
  });

  it("test_isPublicPath_resetPassword_returns_true", () => {
    expect(isPublicPath("/reset-password")).toBe(true);
  });

  it("test_isPublicPath_apiAuth_returns_true", () => {
    expect(isPublicPath("/api/auth")).toBe(true);
    expect(isPublicPath("/api/auth/sign-in")).toBe(true);
  });

  it("test_isPublicPath_invite_token_returns_true", () => {
    expect(isPublicPath("/invite/abc123")).toBe(true);
  });

  it("test_isPublicPath_invite_nested_token_returns_true", () => {
    expect(isPublicPath("/invite/token-with-dashes-and-more")).toBe(true);
  });

  it("test_isPublicPath_hospital_dashboard_returns_false", () => {
    expect(isPublicPath("/hospital/dashboard")).toBe(false);
  });

  it("test_isPublicPath_admin_dashboard_returns_false", () => {
    expect(isPublicPath("/admin/dashboard")).toBe(false);
  });

  it("test_isPublicPath_provider_dashboard_returns_false", () => {
    expect(isPublicPath("/provider/equipment")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// requiresAuth
// ---------------------------------------------------------------------------

describe("requiresAuth", () => {
  it("test_requiresAuth_invite_returns_false", () => {
    expect(requiresAuth("/invite/token123")).toBe(false);
  });

  it("test_requiresAuth_signIn_returns_false", () => {
    expect(requiresAuth("/sign-in")).toBe(false);
  });

  it("test_requiresAuth_hospital_dashboard_returns_true", () => {
    expect(requiresAuth("/hospital/dashboard")).toBe(true);
  });

  it("test_requiresAuth_admin_returns_true", () => {
    expect(requiresAuth("/admin/dashboard")).toBe(true);
  });
});
