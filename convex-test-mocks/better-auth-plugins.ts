/**
 * Stub for better-auth/plugins used in convex-test integration tests.
 *
 * WHY: convex/auth.ts imports { organization } from better-auth/plugins.
 * This stub provides a no-op organization plugin so the module resolves.
 */

export function organization(_options?: Record<string, unknown>) {
  return { id: "organization" };
}
