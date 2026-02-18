/**
 * Auth type export for consuming packages.
 *
 * WHY: The tRPC context (packages/api/src/trpc.ts) needs the Auth type
 * to type the auth instance. With the Convex component model, Better Auth
 * is instantiated in convex/auth.ts, but the type shape is the same.
 *
 * We use better-auth's built-in type inference pattern here.
 */
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

/**
 * Minimal auth instance used only for type inference.
 * This is NOT used at runtime — it's purely for TypeScript.
 *
 * WHY: We need to infer the Auth type without importing from convex/auth.ts
 * (which would create circular dependencies and Convex-specific imports
 * in the shared auth package).
 */
const _authShape = betterAuth({
  plugins: [organization()],
});

/**
 * Auth type — the shape of the Better Auth instance.
 * Used in tRPC context for type-safe auth API calls.
 */
export type Auth = typeof _authShape;

/**
 * Session type inferred from the auth instance.
 */
export type Session = Auth["$Infer"]["Session"];
