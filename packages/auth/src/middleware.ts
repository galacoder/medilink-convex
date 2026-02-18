/**
 * @medilink/auth/middleware - Reusable auth middleware utilities
 *
 * This module provides utilities for checking auth state in middleware.
 * Used by apps/web/src/middleware.ts for route protection.
 *
 * WHY: Centralizing middleware helpers in the auth package allows
 * multiple apps (web, future mobile web) to share the same auth
 * guard logic without duplicating code.
 */

/**
 * Public paths that don't require authentication.
 * Route group prefixes for matching protected paths.
 */
export const PUBLIC_PATHS = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/invite",
] as const;

/**
 * Check if a pathname is a public path that doesn't require auth.
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
