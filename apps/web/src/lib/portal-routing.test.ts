/**
 * Tests for portal routing utilities.
 *
 * WHY: The portal routing logic is the critical path for directing users
 * to the correct portal after authentication. These tests document and
 * verify all routing scenarios across the 3-actor model.
 */
import { describe, expect, it } from "vitest";

import {
  getDefaultRedirectForPortal,
  getPortalFromPathname,
  getPostAuthRedirect,
} from "./portal-routing";

// ---------------------------------------------------------------------------
// getPortalFromPathname
// ---------------------------------------------------------------------------

describe("getPortalFromPathname", () => {
  it("test_getPortalFromPathname_hospital_path", () => {
    expect(getPortalFromPathname("/hospital/dashboard")).toBe("hospital");
  });

  it("test_getPortalFromPathname_provider_path", () => {
    expect(getPortalFromPathname("/provider/equipment")).toBe("provider");
  });

  it("test_getPortalFromPathname_admin_path", () => {
    expect(getPortalFromPathname("/admin/dashboard")).toBe("platform-admin");
  });

  it("test_getPortalFromPathname_auth_path", () => {
    expect(getPortalFromPathname("/sign-in")).toBe("auth");
    expect(getPortalFromPathname("/sign-up")).toBe("auth");
  });

  it("test_getPortalFromPathname_unknown_path", () => {
    expect(getPortalFromPathname("/")).toBe("unknown");
    expect(getPortalFromPathname("/about")).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// getDefaultRedirectForPortal
// ---------------------------------------------------------------------------

describe("getDefaultRedirectForPortal", () => {
  it("test_getDefaultRedirectForPortal_hospital", () => {
    expect(getDefaultRedirectForPortal("hospital")).toBe("/hospital/dashboard");
  });

  it("test_getDefaultRedirectForPortal_provider", () => {
    expect(getDefaultRedirectForPortal("provider")).toBe("/provider/dashboard");
  });

  it("test_getDefaultRedirectForPortal_platform_admin", () => {
    expect(getDefaultRedirectForPortal("platform-admin")).toBe(
      "/admin/dashboard",
    );
  });

  it("test_getDefaultRedirectForPortal_unknown", () => {
    expect(getDefaultRedirectForPortal("unknown")).toBe("/sign-in");
  });
});

// ---------------------------------------------------------------------------
// getPostAuthRedirect
// ---------------------------------------------------------------------------

describe("getPostAuthRedirect", () => {
  it("test_getPostAuthRedirect_platformAdmin_returns_admin_dashboard", () => {
    expect(
      getPostAuthRedirect({
        platformRole: "platform_admin",
        orgType: null,
        activeOrganizationId: null,
      }),
    ).toBe("/admin/dashboard");
  });

  it("test_getPostAuthRedirect_platformSupport_returns_admin_dashboard", () => {
    expect(
      getPostAuthRedirect({
        platformRole: "platform_support",
        orgType: null,
        activeOrganizationId: null,
      }),
    ).toBe("/admin/dashboard");
  });

  it("test_getPostAuthRedirect_hospitalOrg_returns_hospital_dashboard", () => {
    expect(
      getPostAuthRedirect({
        platformRole: null,
        orgType: "hospital",
        activeOrganizationId: "org_123",
      }),
    ).toBe("/hospital/dashboard");
  });

  it("test_getPostAuthRedirect_providerOrg_returns_provider_dashboard", () => {
    expect(
      getPostAuthRedirect({
        platformRole: null,
        orgType: "provider",
        activeOrganizationId: "org_456",
      }),
    ).toBe("/provider/dashboard");
  });

  it("test_getPostAuthRedirect_noOrg_returns_signUp", () => {
    expect(
      getPostAuthRedirect({
        platformRole: null,
        orgType: null,
        activeOrganizationId: null,
      }),
    ).toBe("/sign-up");
  });

  it("test_getPostAuthRedirect_noSession_returns_signIn", () => {
    expect(getPostAuthRedirect(null)).toBe("/sign-in");
  });

  it("test_getPostAuthRedirect_hasOrgId_but_unknownOrgType_returns_hospital", () => {
    // When org exists but type is unknown, default to hospital portal
    expect(
      getPostAuthRedirect({
        platformRole: null,
        orgType: null,
        activeOrganizationId: "org_789",
      }),
    ).toBe("/hospital/dashboard");
  });
});
