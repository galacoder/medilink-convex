/**
 * @medilink/backend — Convex backend package
 *
 * Wraps the Convex generated API for type-safe imports across apps.
 * Both apps/web and apps/expo import from "@medilink/backend".
 *
 * Pattern from: get-convex/turbo-expo-nextjs-clerk-convex-monorepo
 */

// Re-export Convex generated API — provides type-safe function references
// Usage: import { api } from "@medilink/backend"
export { api } from "../../convex/_generated/api";

// Re-export Convex data types for TypeScript
export type { Id, Doc } from "../../convex/_generated/dataModel";
