/**
 * Stub for better-auth/minimal used in convex-test integration tests.
 *
 * WHY: convex/auth.ts imports better-auth/minimal for production use.
 * In convex-test (vitest) environments, the full better-auth package is not
 * available. This stub exports no-op implementations that allow the module
 * to be imported without errors, while convex-test's JWT-based identity
 * (t.withIdentity) handles authentication directly.
 *
 * vi: "Giả lập better-auth/minimal cho kiểm tra" / en: "better-auth/minimal stub for tests"
 */

export type BetterAuthOptions = Record<string, unknown>;

export function betterAuth(_options: BetterAuthOptions) {
  return {
    handler: async () => new Response("stub"),
    api: {},
  };
}
