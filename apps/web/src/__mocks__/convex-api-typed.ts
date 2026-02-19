/**
 * Typed stub for the Convex generated API — used by TypeScript typecheck only.
 *
 * WHY: The real convex/_generated/api is gitignored. This stub provides
 * proper FunctionReference types so `tsc --noEmit` passes without running
 * `npx convex dev`. The tsconfig.json paths alias points here as fallback.
 *
 * At runtime (both dev and test), the real generated file or the vitest
 * alias (convex-api.ts) takes precedence.
 */
import { makeFunctionReference } from "convex/server";

export const api = {
  serviceRequests: {
    listByHospital: makeFunctionReference<"query">("serviceRequests:listByHospital"),
    getById: makeFunctionReference<"query">("serviceRequests:getById"),
    create: makeFunctionReference<"mutation">("serviceRequests:create"),
    cancel: makeFunctionReference<"mutation">("serviceRequests:cancel"),
    updateStatus: makeFunctionReference<"mutation">("serviceRequests:updateStatus"),
  },
  quotes: {
    accept: makeFunctionReference<"mutation">("quotes:accept"),
    reject: makeFunctionReference<"mutation">("quotes:reject"),
    submit: makeFunctionReference<"mutation">("quotes:submit"),
  },
  serviceRatings: {
    create: makeFunctionReference<"mutation">("serviceRatings:create"),
  },
  equipment: {
    list: makeFunctionReference<"query">("equipment:list"),
    getById: makeFunctionReference<"query">("equipment:getById"),
  },
} as const;
