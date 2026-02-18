/**
 * @medilink/auth - Server-side auth exports
 *
 * This package provides shared auth configuration and type exports.
 * The Better Auth instance itself lives in convex/auth.ts (Convex component model).
 *
 * WHY: The Convex component model requires Better Auth to be instantiated
 * per-request with the Convex context. This package provides the shared
 * configuration types and re-exports for consuming packages.
 */

// Re-export organization plugin for use in convex/auth.ts
export { organization } from "better-auth/plugins";

// Re-export useful Better Auth types for consuming packages
export type {
  BetterAuthOptions,
  BetterAuthPlugin,
  Session,
  User,
} from "better-auth";

/**
 * Auth type for use in tRPC context and other server-side code.
 * This is a placeholder type that matches the shape returned by
 * createAuth() in convex/auth.ts.
 *
 * WHY: tRPC context (packages/api/src/trpc.ts) imports Auth type
 * from @medilink/auth to type the auth instance passed in.
 */
export type { Auth } from "./types";
