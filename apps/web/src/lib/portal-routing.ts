/**
 * Portal routing utilities for Next.js middleware.
 *
 * WHY: Centralizes all portal routing logic so middleware.ts stays readable.
 * These pure functions determine which portal a request belongs to and
 * where to redirect based on session data.
 *
 * IMPORTANT: This file must be importable in Edge Runtime (no Node.js APIs).
 */

export type PortalType =
  | "hospital"
  | "provider"
  | "platform-admin"
  | "auth"
  | "unknown";

export const PORTAL_PATHS = {
  hospital: "/hospital",
  provider: "/provider",
  admin: "/admin",
  auth: "/sign-in",
} as const;

export const PORTAL_ROUTES = {
  hospital: ["/hospital"],
  provider: ["/provider"],
  admin: ["/admin"],
  auth: ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"],
  public: ["/", "/api"],
} as const;

/**
 * Determine which portal a pathname belongs to.
 *
 * WHY: Used by middleware to check if a user is accessing the correct
 * portal for their role (e.g., prevent hospital users from hitting /admin).
 */
export function getPortalFromPathname(pathname: string): PortalType {
  if (pathname.startsWith("/hospital")) return "hospital";
  if (pathname.startsWith("/provider")) return "provider";
  if (pathname.startsWith("/admin")) return "platform-admin";
  if (
    ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"].some((p) =>
      pathname.startsWith(p),
    )
  )
    return "auth";
  return "unknown";
}

/**
 * Get the default dashboard URL for a given portal type.
 *
 * WHY: Middleware needs to redirect users to their dashboard after auth
 * or when they hit the wrong portal. This keeps redirect URLs centralized.
 */
export function getDefaultRedirectForPortal(portal: PortalType): string {
  switch (portal) {
    case "hospital":
      return "/hospital/dashboard";
    case "provider":
      return "/provider/dashboard";
    case "platform-admin":
      return "/admin/dashboard";
    default:
      return "/sign-in";
  }
}

/**
 * Session data shape returned from /api/auth/get-session.
 *
 * WHY: Typed shape prevents runtime errors when accessing session fields
 * in middleware. Matches the Better Auth session structure.
 */
export interface MiddlewareSessionData {
  platformRole?: string | null;
  orgType?: string | null;
  activeOrganizationId?: string | null;
}

/**
 * Get the expected org_type for a given portal.
 *
 * WHY: Maps portal routes to the org_type that should be accessing them.
 * Returns null for platform-admin (checked via platformRole, not orgType).
 * Used to enforce cross-portal access boundaries in middleware Branch 4.
 */
export function getExpectedOrgTypeForPortal(portal: PortalType): string | null {
  switch (portal) {
    case "hospital":
      return "hospital";
    case "provider":
      return "provider";
    default:
      // platform-admin uses platformRole check, not orgType
      return null;
  }
}

/**
 * Determine the correct post-authentication redirect URL based on session data.
 *
 * WHY: After sign-in, users must be routed to the correct portal dashboard
 * based on their role and organization type. This centralizes that logic
 * so both the sign-in page and middleware share the same routing rules.
 *
 * Priority order:
 * 1. Platform admin/support → /admin/dashboard
 * 2. Hospital org → /hospital/dashboard
 * 3. Provider org → /provider/dashboard
 * 4. No active org → /sign-up (complete onboarding)
 * 5. Has org but unknown type → /hospital/dashboard (safe default)
 * 6. Null session → /sign-in
 */
export function getPostAuthRedirect(
  session: MiddlewareSessionData | null,
): string {
  if (!session) return "/sign-in";

  // Platform admin/support always go to admin portal
  if (
    session.platformRole === "platform_admin" ||
    session.platformRole === "platform_support"
  ) {
    return "/admin/dashboard";
  }

  // User has an active organization — route to their portal by org type
  if (session.activeOrganizationId) {
    if (session.orgType === "provider") return "/provider/dashboard";
    // Hospital is the default for known hospital orgs or unknown org type
    return "/hospital/dashboard";
  }

  // No active org — send to sign-up to complete onboarding
  return "/sign-up";
}
