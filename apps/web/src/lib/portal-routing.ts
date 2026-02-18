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
