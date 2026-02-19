/**
 * Stub for @convex-dev/better-auth used in convex-test integration tests.
 *
 * WHY: convex/auth.ts imports from @convex-dev/better-auth.
 * This stub provides no-op implementations for the test environment.
 */

export type GenericCtx = Record<string, unknown>;
export type BetterAuthOptions = Record<string, unknown>;

export function createClient(_component: unknown) {
  return {
    adapter: () => ({}),
    getAuthUser: async () => null,
    handler: async (_ctx: unknown, _request: unknown) =>
      new Response("stub"),
    registerRoutes: () => {},
  };
}
