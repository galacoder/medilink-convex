/**
 * packages/db: Convex database type re-exports.
 *
 * The MediLink database schema lives in `convex/schema.ts` at the monorepo root.
 * Convex generates TypeScript types into `convex/_generated/` when you run:
 *
 *   npx convex dev    (local development)
 *   npx convex deploy (production deployment)
 *
 * Import Convex types directly from the generated output:
 *   import type { Doc, Id } from "../../../convex/_generated/dataModel"
 *
 * Or from feature modules, use the Convex API:
 *   import { api } from "~/convex/_generated/api"
 *
 * This package is kept as a stub for future Convex type re-exports once
 * `convex/_generated/` has been created by running `npx convex dev`.
 */
export {};
