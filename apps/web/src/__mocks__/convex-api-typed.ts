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
    listByHospital: makeFunctionReference<"query">(
      "serviceRequests:listByHospital",
    ),
    getById: makeFunctionReference<"query">("serviceRequests:getById"),
    create: makeFunctionReference<"mutation">("serviceRequests:create"),
    cancel: makeFunctionReference<"mutation">("serviceRequests:cancel"),
    updateStatus: makeFunctionReference<"mutation">(
      "serviceRequests:updateStatus",
    ),
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
  disputes: {
    listByHospital: makeFunctionReference<"query">("disputes:listByHospital"),
    getById: makeFunctionReference<"query">("disputes:getById"),
    getMessages: makeFunctionReference<"query">("disputes:getMessages"),
    create: makeFunctionReference<"mutation">("disputes:create"),
    updateStatus: makeFunctionReference<"mutation">("disputes:updateStatus"),
    addMessage: makeFunctionReference<"mutation">("disputes:addMessage"),
    escalate: makeFunctionReference<"mutation">("disputes:escalate"),
    resolve: makeFunctionReference<"mutation">("disputes:resolve"),
  },
  providers: {
    getProfile: makeFunctionReference<"query">("providers:getProfile"),
    listServiceOfferings: makeFunctionReference<"query">(
      "providers:listServiceOfferings",
    ),
    getCertifications: makeFunctionReference<"query">(
      "providers:getCertifications",
    ),
    addServiceOffering: makeFunctionReference<"mutation">(
      "providers:addServiceOffering",
    ),
    updateServiceOffering: makeFunctionReference<"mutation">(
      "providers:updateServiceOffering",
    ),
    removeServiceOffering: makeFunctionReference<"mutation">(
      "providers:removeServiceOffering",
    ),
    addCertification: makeFunctionReference<"mutation">(
      "providers:addCertification",
    ),
    setCoverageArea: makeFunctionReference<"mutation">(
      "providers:setCoverageArea",
    ),
    updateProfile: makeFunctionReference<"mutation">("providers:updateProfile"),
  },
} as const;
