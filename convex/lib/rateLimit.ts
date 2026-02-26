/**
 * Per-organization rate limiting using @convex-dev/rate-limiter.
 *
 * WHY: Prevents abuse of mutation endpoints by limiting request rates
 * per organization. Uses the official Convex rate limiter component which
 * protects all access patterns (HTTP, WebSocket, SDK calls).
 *
 * vi: "Gioi han toc do theo to chuc" / en: "Per-organization rate limiting"
 */

import { MINUTE, RateLimiter, isRateLimitError } from "@convex-dev/rate-limiter";
import { ConvexError } from "convex/values";

import type { Id } from "../_generated/dataModel";
// WHY: `components` is exported from _generated/api.js (via componentsGeneric())
// but the .d.ts won't include `rateLimiter` until `npx convex dev` regenerates
// types after convex.config.ts is committed. The `as any` avoids the TS error
// for the missing property while preserving runtime correctness. After deploy,
// running `npx convex dev` will regenerate the types and the assertion can be
// removed.
import { components } from "../_generated/api";

// ---------------------------------------------------------------------------
// Rate limit configurations
// ---------------------------------------------------------------------------

/**
 * Rate limit configurations for protected mutation endpoints.
 *
 * Token bucket algorithm: `rate` tokens are added per `period`,
 * and `capacity` is the max burst allowed at once.
 *
 * | Endpoint                       | Rate  | Period | Capacity | Rationale                     |
 * |--------------------------------|-------|--------|----------|-------------------------------|
 * | equipment.create               | 20/m  | 1 min  | 5        | Bulk creation loop protection |
 * | consumables.recordUsage        | 60/m  | 1 min  | 10       | Repeated tiny deductions      |
 * | serviceRequests.create         | 10/m  | 1 min  | 3        | Service request flood         |
 * | quotes.submit                  | 10/m  | 1 min  | 3        | Quote spam                    |
 * | serviceRequests.updateProgress | 30/m  | 1 min  | 10       | Progress note flood           |
 */
export const RATE_LIMIT_CONFIGS = {
  "equipment.create": {
    kind: "token bucket" as const,
    rate: 20,
    period: MINUTE,
    capacity: 5,
  },
  "consumables.recordUsage": {
    kind: "token bucket" as const,
    rate: 60,
    period: MINUTE,
    capacity: 10,
  },
  "serviceRequests.create": {
    kind: "token bucket" as const,
    rate: 10,
    period: MINUTE,
    capacity: 3,
  },
  "quotes.submit": {
    kind: "token bucket" as const,
    rate: 10,
    period: MINUTE,
    capacity: 3,
  },
  "serviceRequests.updateProgress": {
    kind: "token bucket" as const,
    rate: 30,
    period: MINUTE,
    capacity: 10,
  },
};

/** Type for valid rate-limited endpoint names. */
export type RateLimitedEndpoint = keyof typeof RATE_LIMIT_CONFIGS;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rateLimiter = new RateLimiter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (components as any).rateLimiter,
  RATE_LIMIT_CONFIGS,
);

// ---------------------------------------------------------------------------
// Public helper
// ---------------------------------------------------------------------------

/**
 * Checks per-organization rate limit for the given endpoint.
 * Call this AFTER auth and BEFORE any DB writes in a mutation handler.
 *
 * Throws a bilingual ConvexError with retry-after seconds when exceeded.
 *
 * In environments where the rate limiter component is not installed (e.g.
 * convex-test), the function gracefully falls through. The rate limiter
 * component is only fully functional after `npx convex dev` or deploy.
 *
 * vi: "Kiem tra gioi han toc do theo to chuc"
 * en: "Check per-org rate limit for endpoint"
 *
 * @param ctx - Mutation context (needs runMutation for rate limiter component)
 * @param organizationId - The caller's organization ID (rate limit key)
 * @param endpoint - The endpoint name matching RATE_LIMIT_CONFIGS
 */
export async function checkOrgRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Convex GenericMutationCtx has specific method signatures that are incompatible with narrow unknown[] params
  ctx: { runMutation: any; runQuery: any },
  organizationId: Id<"organizations">,
  endpoint: RateLimitedEndpoint,
): Promise<void> {
  let result: { ok?: boolean; retryAfter?: number };

  try {
    result = await rateLimiter.limit(ctx, endpoint, {
      key: organizationId,
    });
  } catch (error: unknown) {
    // If the rate limiter itself throws a RateLimitError (via throws: true mode),
    // re-throw as our bilingual error. Otherwise, the component is likely not
    // installed (test/dev environment) — allow the operation to proceed.
    if (isRateLimitError(error)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const retryAfter = (error as any).data?.retryAfter ?? 0;
      const retrySeconds = Math.ceil(retryAfter / 1000);
      throw new ConvexError({
        vi: `Qua nhieu yeu cau. Vui long thu lai sau ${retrySeconds} giay.`,
        en: `Rate limit exceeded. Please try again in ${retrySeconds} seconds.`,
      });
    }
    // Component not installed or other infrastructure error — fail open
    return;
  }

  // Guard: if the result doesn't have the expected `ok` property (e.g., the
  // component isn't properly installed and the mock ctx returned an empty
  // object), treat it as a pass-through rather than a rate limit denial.
  if (typeof result?.ok !== "boolean") {
    return;
  }

  if (!result.ok) {
    const retrySeconds = Math.ceil((result.retryAfter ?? 0) / 1000);
    throw new ConvexError({
      vi: `Qua nhieu yeu cau. Vui long thu lai sau ${retrySeconds} giay.`,
      en: `Rate limit exceeded. Please try again in ${retrySeconds} seconds.`,
    });
  }
}
