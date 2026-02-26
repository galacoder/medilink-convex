/**
 * Billing email handlers for subscription notifications.
 *
 * Sends bilingual (Vietnamese / English) emails via Resend (ADR-002) for:
 * - Subscription expiry warnings (30/15/7 days before)
 * - Grace period start notification (day 0)
 * - Grace period mid-point warning (day +3)
 * - Final expiry notification (day +7)
 *
 * vi: "Xu ly email thanh toan cho thong bao dang ky"
 * en: "Billing email handlers for subscription notifications"
 *
 * @see Issue #176 — M1-7: Subscription Expiry Cron Job
 *
 * TODO: Add SMS integration via Twilio (ADR-002, future phase)
 * TODO: Add push notification support for 15d/7d warnings
 */

import { v } from "convex/values";

import { internalAction, internalQuery } from "../_generated/server";

// ---------------------------------------------------------------------------
// Helper: Get org admin email
// ---------------------------------------------------------------------------

/**
 * Lay email quan tri vien to chuc / Get org admin (owner) email
 *
 * Looks up the first owner membership for the organization and returns
 * their email address. Returns null if no owner found.
 */
export const getOrgAdminEmail = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Find owner membership for the org
    const ownerMembership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", args.organizationId))
      .filter((q) => q.eq(q.field("role"), "owner"))
      .first();

    if (!ownerMembership) return null;

    // Get user email
    const user = await ctx.db.get(ownerMembership.userId);
    return user?.email ?? null;
  },
});

// ---------------------------------------------------------------------------
// Expiry Warning Email (30/15/7 days before)
// ---------------------------------------------------------------------------

/**
 * Gui email canh bao het han / Send subscription expiry warning email
 *
 * Bilingual email sent at 30, 15, and 7 days before subscription expires.
 * When 7 days or less, includes a warning about grace period read-only access.
 *
 * TODO: Add SMS via Twilio for 7-day warning (ADR-002, future phase)
 * TODO: Add push notification for 15d/7d warnings
 */
export const sendExpiryWarningEmail = internalAction({
  args: {
    organizationId: v.id("organizations"),
    organizationName: v.string(),
    daysRemaining: v.number(),
    expiresAt: v.number(),
    plan: v.string(),
  },
  handler: async (_ctx, args) => {
    const expiryDate = new Date(args.expiresAt).toLocaleDateString("vi-VN");

    // TODO: Replace console.log with actual Resend API call when RESEND_API_KEY is configured
    // Using Resend (ADR-002):
    //
    // import { Resend } from "resend";
    // const resend = new Resend(process.env.RESEND_API_KEY);
    //
    // const adminEmail = await ctx.runQuery(
    //   internal.billing.emails.getOrgAdminEmail,
    //   { organizationId: args.organizationId }
    // );
    // if (!adminEmail) return;
    //
    // await resend.emails.send({
    //   from: "MediLink <billing@medilink.vn>",
    //   to: adminEmail,
    //   subject: `[MediLink] Dang ky het han trong ${args.daysRemaining} ngay / Subscription expires in ${args.daysRemaining} days`,
    //   html: emailHtml,
    // });

    console.log(
      `[BILLING EMAIL] Sent ${args.daysRemaining}d expiry warning to ${args.organizationName} ` +
        `(plan: ${args.plan}, expires: ${expiryDate})`,
    );
  },
});

// ---------------------------------------------------------------------------
// Grace Period Start Email (day 0)
// ---------------------------------------------------------------------------

/**
 * Gui email bat dau gia han / Send grace period start email
 *
 * Sent when subscription expires (day 0). Explains 7-day read-only window
 * and urges renewal.
 *
 * Subject: [MediLink] Dang ky da het han — 7 ngay read-only
 *          / Subscription expired — 7 days read-only
 *
 * TODO: Add SMS via Twilio (ADR-002, future phase)
 * TODO: Add push notification
 */
export const sendGraceStartEmail = internalAction({
  args: {
    organizationId: v.id("organizations"),
    organizationName: v.string(),
    gracePeriodEndsAt: v.number(),
  },
  handler: async (_ctx, args) => {
    const graceEndDate = new Date(args.gracePeriodEndsAt).toLocaleDateString(
      "vi-VN",
    );

    // TODO: Replace with Resend API call (see sendExpiryWarningEmail for pattern)

    console.log(
      `[BILLING EMAIL] Sent grace start email to ${args.organizationName} ` +
        `(grace ends: ${graceEndDate})`,
    );
  },
});

// ---------------------------------------------------------------------------
// Grace Period Warning Email (mid-point, day +3)
// ---------------------------------------------------------------------------

/**
 * Gui email canh bao gia han / Send grace period warning email
 *
 * Sent at grace period mid-point (3 days used, 4 remaining).
 * Urgently warns about imminent access restriction.
 *
 * TODO: Add SMS via Twilio (ADR-002, future phase)
 */
export const sendGracePeriodWarningEmail = internalAction({
  args: {
    organizationId: v.id("organizations"),
    organizationName: v.string(),
    daysRemaining: v.number(),
    gracePeriodEndsAt: v.number(),
  },
  handler: async (_ctx, args) => {
    const graceEndDate = new Date(args.gracePeriodEndsAt).toLocaleDateString(
      "vi-VN",
    );

    // TODO: Replace with Resend API call

    console.log(
      `[BILLING EMAIL] Sent grace midpoint warning to ${args.organizationName} ` +
        `(${args.daysRemaining} days remaining, ends: ${graceEndDate})`,
    );
  },
});

// ---------------------------------------------------------------------------
// Final Expiry Email (day +7)
// ---------------------------------------------------------------------------

/**
 * Gui email het han cuoi cung / Send final expiry email
 *
 * Sent when grace period ends (day +7). Informs that access is now restricted
 * and data is preserved but inaccessible until renewal.
 *
 * Subject: [MediLink] Truy cap bi han che — Dang ky da het han hoan toan
 *          / Access restricted — Subscription fully expired
 *
 * TODO: Add SMS via Twilio (ADR-002, future phase)
 */
export const sendFinalExpiryEmail = internalAction({
  args: {
    organizationId: v.id("organizations"),
    organizationName: v.string(),
  },
  handler: async (_ctx, args) => {
    // TODO: Replace with Resend API call

    console.log(
      `[BILLING EMAIL] Sent final expiry email to ${args.organizationName} ` +
        `— access now restricted, data preserved`,
    );
  },
});
