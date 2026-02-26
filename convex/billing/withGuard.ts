/**
 * Subscription guard helper for use directly in mutation handlers.
 *
 * WHY: Unlike the internalQuery guards (which are for cross-function calls),
 * this helper is a plain async function that can be called directly within
 * a mutation handler to check subscription status without an additional
 * internal query round-trip.
 *
 * Usage:
 *   const org = await withSubscriptionGuard(ctx, organizationId);
 *   // ... proceed with mutation knowing subscription is active
 *
 * vi: "Ham tien ich kiem tra dang ky trong mutation"
 * en: "Subscription check utility for mutations"
 */

import { ConvexError } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { BILLING_ERRORS } from "./errors";

/**
 * Checks subscription status before executing a mutation.
 * Only allows active and trial orgs. Orgs without a status field
 * are treated as active (backward compatibility with legacy orgs).
 *
 * vi: "Kiem tra dang ky truoc khi thuc thi mutation"
 * en: "Check subscription before executing mutation"
 *
 * @throws ConvexError with ORG_NOT_FOUND if org doesn't exist
 * @throws ConvexError with SUBSCRIPTION_INACTIVE if org is not active/trial
 */
export async function withSubscriptionGuard(
  ctx: MutationCtx | QueryCtx,
  organizationId: Id<"organizations">,
) {
  const org = await ctx.db.get(organizationId);
  if (!org) {
    throw new ConvexError({
      code: BILLING_ERRORS.ORG_NOT_FOUND.code,
      message: BILLING_ERRORS.ORG_NOT_FOUND.message,
      messageVi: BILLING_ERRORS.ORG_NOT_FOUND.messageVi,
    });
  }

  const status = org.status;

  // Khong co trang thai (legacy) hoac active/trial -> cho phep
  // No status (legacy) or active/trial -> allow
  if (!status || status === "active" || status === "trial") {
    return org;
  }

  // Tat ca trang thai khac -> tu choi / All other statuses -> deny
  throw new ConvexError({
    code: BILLING_ERRORS.SUBSCRIPTION_INACTIVE.code,
    message: "Active subscription required",
    messageVi: "Can dang ky hoat dong",
    status: status,
  });
}
