/**
 * Subscription expiry cron job handlers.
 *
 * Daily check that transitions organization subscription statuses:
 *   active -> grace_period (7-day read-only window after expiry)
 *   grace_period -> expired (full access restriction)
 *
 * Also sends warning emails at 30/15/7 days before expiry and during grace.
 *
 * vi: "Xu ly cron kiem tra het han dang ky"
 * en: "Subscription expiry cron job handlers"
 *
 * @see Issue #176 — M1-7: Subscription Expiry Cron Job
 */

import { v } from "convex/values";

import { internal } from "../_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Milliseconds in one day */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Grace period duration: 7 days after subscription expiry */
const GRACE_PERIOD_DAYS = 7;

/** Warning thresholds in days before expiry */
const WARNING_THRESHOLDS = [30, 15, 7] as const;

/** Grace period mid-point: 4 days remaining (3 days used of 7) */
const GRACE_MIDPOINT_REMAINING = 4;

// ---------------------------------------------------------------------------
// Main orchestrator action
// ---------------------------------------------------------------------------

/**
 * Kiem tra het han hang ngay / Daily subscription expiry check
 *
 * Orchestrates three phases:
 * 1. Transition active -> grace_period for expired subscriptions
 * 2. Transition grace_period -> expired for ended grace periods
 * 3. Send warning and notification emails
 */
export const dailySubscriptionCheck = internalAction({
  handler: async (ctx) => {
    const now = Date.now();

    // === Phase 1: Transition active -> grace_period ===
    // Tim cac to chuc co dang ky het han / Find orgs with expired subscriptions
    const phase1 = await ctx.runMutation(
      internal.billing.crons.transitionExpiredToGrace,
      { now },
    );

    // === Phase 2: Transition grace_period -> expired ===
    // Tim cac to chuc co thoi gian gia han ket thuc / Find orgs with ended grace periods
    const phase2 = await ctx.runMutation(
      internal.billing.crons.transitionGraceToExpired,
      { now },
    );

    // === Phase 3: Send warning emails ===
    // Gui email canh bao truoc khi het han / Send expiry warning emails
    await ctx.runAction(internal.billing.crons.sendExpiryWarnings, { now });

    console.log(
      `[BILLING CRON] Daily check complete: ${phase1.transitioned} to grace_period, ${phase2.transitioned} to expired`,
    );
  },
});

// ---------------------------------------------------------------------------
// Phase 1: Transition active -> grace_period
// ---------------------------------------------------------------------------

/**
 * Chuyen trang thai tu active sang grace_period
 * Transition organizations from active to grace_period when subscription expired.
 *
 * Sets gracePeriodEndsAt = subscriptionExpiresAt + 7 days.
 * Also updates the active subscription record status to "expired".
 */
export const transitionExpiredToGrace = internalMutation({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    // Query all orgs with active status using index
    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter to those whose subscription has expired
    const expired = orgs.filter(
      (org) =>
        org.subscriptionExpiresAt != null &&
        org.subscriptionExpiresAt <= args.now,
    );

    for (const org of expired) {
      // 1. Update org status to grace_period
      await ctx.db.patch(org._id, {
        status: "grace_period",
        gracePeriodEndsAt:
          org.subscriptionExpiresAt! + GRACE_PERIOD_DAYS * DAY_MS,
        updatedAt: args.now,
      });

      // 2. Update active subscription record to expired
      const activeSub = await ctx.db
        .query("subscriptions")
        .withIndex("by_organizationId_status", (q) =>
          q.eq("organizationId", org._id).eq("status", "active"),
        )
        .unique();

      if (activeSub) {
        await ctx.db.patch(activeSub._id, {
          status: "expired",
          updatedAt: args.now,
        });
      }

      // 3. Log for monitoring
      console.log(
        `[BILLING] Org ${org._id} (${org.name}) transitioned active -> grace_period`,
      );
    }

    return { transitioned: expired.length };
  },
});

// ---------------------------------------------------------------------------
// Phase 2: Transition grace_period -> expired
// ---------------------------------------------------------------------------

/**
 * Chuyen trang thai tu grace_period sang expired
 * Transition organizations from grace_period to expired when grace ends.
 */
export const transitionGraceToExpired = internalMutation({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_status", (q) => q.eq("status", "grace_period"))
      .collect();

    // Filter to those whose grace period has ended
    const graceEnded = orgs.filter(
      (org) =>
        org.gracePeriodEndsAt != null && org.gracePeriodEndsAt <= args.now,
    );

    for (const org of graceEnded) {
      await ctx.db.patch(org._id, {
        status: "expired",
        updatedAt: args.now,
      });

      console.log(
        `[BILLING] Org ${org._id} (${org.name}) transitioned grace_period -> expired`,
      );
    }

    return { transitioned: graceEnded.length };
  },
});

// ---------------------------------------------------------------------------
// Phase 3: Send warning emails
// ---------------------------------------------------------------------------

/**
 * Gui email canh bao het han / Send expiry warning emails
 *
 * Sends warnings at 30, 15, 7 days before expiry for active orgs.
 * Sends grace start email on expiry day (day 0).
 * Sends grace mid-point email at day +3 (4 days remaining).
 * Sends final expiry email when grace period ends (day +7).
 *
 * Uses lastBillingEmailSentAt + lastBillingEmailType on org to prevent
 * duplicate emails (idempotency).
 *
 * TODO: Add SMS integration via Twilio (ADR-002, future phase)
 */
export const sendExpiryWarnings = internalAction({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const { now } = args;

    // --- Active org warnings (30, 15, 7 days before expiry) ---
    const activeOrgs = await ctx.runQuery(
      internal.billing.crons.getActiveOrgsWithExpiry,
    );

    for (const org of activeOrgs) {
      if (!org.subscriptionExpiresAt) continue;

      const daysUntilExpiry = Math.ceil(
        (org.subscriptionExpiresAt - now) / DAY_MS,
      );

      // Check for 30/15/7 day warning thresholds
      if (WARNING_THRESHOLDS.includes(daysUntilExpiry as 30 | 15 | 7)) {
        const emailType = `expiry_${daysUntilExpiry}d`;

        // Skip if we already sent this exact warning type today (idempotency)
        if (
          org.lastBillingEmailType === emailType &&
          org.lastBillingEmailSentAt != null &&
          now - org.lastBillingEmailSentAt < DAY_MS
        ) {
          continue;
        }

        await ctx.runAction(internal.billing.emails.sendExpiryWarningEmail, {
          organizationId: org._id,
          organizationName: org.name,
          daysRemaining: daysUntilExpiry,
          expiresAt: org.subscriptionExpiresAt,
          plan: org.subscriptionPlan ?? "starter",
        });

        // Track that we sent this email
        await ctx.runMutation(
          internal.billing.crons.updateBillingEmailTracking,
          {
            organizationId: org._id,
            emailType,
            sentAt: now,
          },
        );
      }

      // Check for day 0 (grace start) — subscription just expired
      if (daysUntilExpiry === 0) {
        const emailType = "grace_start";
        if (
          org.lastBillingEmailType === emailType &&
          org.lastBillingEmailSentAt != null &&
          now - org.lastBillingEmailSentAt < DAY_MS
        ) {
          continue;
        }

        await ctx.runAction(internal.billing.emails.sendGraceStartEmail, {
          organizationId: org._id,
          organizationName: org.name,
          gracePeriodEndsAt:
            org.subscriptionExpiresAt + GRACE_PERIOD_DAYS * DAY_MS,
        });

        await ctx.runMutation(
          internal.billing.crons.updateBillingEmailTracking,
          {
            organizationId: org._id,
            emailType,
            sentAt: now,
          },
        );
      }
    }

    // --- Grace period warnings (mid-point + final expiry) ---
    const graceOrgs = await ctx.runQuery(
      internal.billing.crons.getGracePeriodOrgs,
    );

    for (const org of graceOrgs) {
      if (!org.gracePeriodEndsAt) continue;

      const daysUntilGraceEnd = Math.ceil(
        (org.gracePeriodEndsAt - now) / DAY_MS,
      );

      // Grace mid-point: 4 days remaining (3 days used of 7)
      if (daysUntilGraceEnd === GRACE_MIDPOINT_REMAINING) {
        const emailType = "grace_midpoint";
        if (
          org.lastBillingEmailType === emailType &&
          org.lastBillingEmailSentAt != null &&
          now - org.lastBillingEmailSentAt < DAY_MS
        ) {
          continue;
        }

        await ctx.runAction(
          internal.billing.emails.sendGracePeriodWarningEmail,
          {
            organizationId: org._id,
            organizationName: org.name,
            daysRemaining: daysUntilGraceEnd,
            gracePeriodEndsAt: org.gracePeriodEndsAt,
          },
        );

        await ctx.runMutation(
          internal.billing.crons.updateBillingEmailTracking,
          {
            organizationId: org._id,
            emailType,
            sentAt: now,
          },
        );
      }

      // Final expiry: 0 days remaining (grace ended)
      if (daysUntilGraceEnd <= 0) {
        const emailType = "final_expiry";
        if (
          org.lastBillingEmailType === emailType &&
          org.lastBillingEmailSentAt != null &&
          now - org.lastBillingEmailSentAt < DAY_MS
        ) {
          continue;
        }

        await ctx.runAction(internal.billing.emails.sendFinalExpiryEmail, {
          organizationId: org._id,
          organizationName: org.name,
        });

        await ctx.runMutation(
          internal.billing.crons.updateBillingEmailTracking,
          {
            organizationId: org._id,
            emailType,
            sentAt: now,
          },
        );
      }
    }
  },
});

// ---------------------------------------------------------------------------
// Helper mutations
// ---------------------------------------------------------------------------

/**
 * Cap nhat theo doi email thanh toan / Update billing email tracking
 *
 * Records when the last billing email was sent to prevent duplicates.
 */
export const updateBillingEmailTracking = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    emailType: v.string(),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.organizationId, {
      lastBillingEmailSentAt: args.sentAt,
      lastBillingEmailType: args.emailType,
      updatedAt: args.sentAt,
    });
  },
});

// ---------------------------------------------------------------------------
// Helper queries
// ---------------------------------------------------------------------------

/**
 * Lay cac to chuc hoat dong co ngay het han / Get active orgs with expiry date
 */
export const getActiveOrgsWithExpiry = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

/**
 * Lay cac to chuc trong thoi gian gia han / Get grace period organizations
 */
export const getGracePeriodOrgs = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_status", (q) => q.eq("status", "grace_period"))
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Monthly AI credit reset (Issue #174 — M1-5)
// ---------------------------------------------------------------------------

/**
 * Reset credit AI hang thang / Monthly AI credit reset orchestrator
 *
 * Runs on the 1st of every month at 00:00 UTC. For each active/trial org:
 * 1. Gets the org's current subscription plan
 * 2. Looks up monthlyIncluded credits from the plan
 * 3. Resets: balance = monthlyIncluded (no rollover), monthlyUsed = 0
 * 4. bonusCredits are NOT reset (they persist)
 *
 * Inactive orgs (expired, suspended, grace_period) are skipped.
 *
 * @see Issue #174 — M1-5: AI Credit System
 */
export const monthlyAiCreditReset = internalAction({
  handler: async (ctx) => {
    // 1. Query all aiCredits records
    const allCredits = await ctx.runQuery(
      internal.billing.crons.getAllAiCreditsRecords,
    );

    let resetCount = 0;
    let skippedCount = 0;

    // 2. Process each credits record
    for (const creditRecord of allCredits) {
      await ctx.runMutation(internal.billing.crons.resetOrgCredits, {
        organizationId: creditRecord.organizationId,
      });

      // We track counts but the actual skip/reset logic is in the mutation
      resetCount++;
    }

    console.log(
      `[BILLING CRON] Monthly AI credit reset complete: ${resetCount} records processed, ${skippedCount} skipped`,
    );
  },
});

/**
 * Reset credit cho mot to chuc / Reset credits for a single organization
 *
 * Called by the monthlyAiCreditReset action for each org.
 * Skips orgs that are not "active" or "trial".
 * No-rollover: balance is SET to monthlyIncluded (not added).
 */
export const resetOrgCredits = internalMutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // 1. Get org to check status
    const org = await ctx.db.get(args.organizationId);
    if (!org) return;

    // 2. Skip inactive orgs (only reset for active and trial)
    const activeStatuses = ["active", "trial"];
    if (!org.status || !activeStatuses.includes(org.status)) {
      console.log(
        `[BILLING] Skip credit reset for org ${args.organizationId} (status: ${org.status ?? "none"})`,
      );
      return;
    }

    // 3. Get credits record
    const orgCredits = await ctx.db
      .query("aiCredits")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (!orgCredits) return;

    // 4. Get the org's active subscription to look up monthlyAiCredits
    const activeSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_organizationId_status", (q) =>
        q.eq("organizationId", args.organizationId).eq("status", "active"),
      )
      .first();

    // Use subscription's monthlyAiCredits, or fall back to the existing monthlyIncluded
    const monthlyIncluded =
      activeSub?.monthlyAiCredits ?? orgCredits.monthlyIncluded;

    // 5. Calculate next month's reset date (1st of next month UTC)
    const now = new Date();
    const nextMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0),
    );

    // 6. Reset credits (no rollover)
    await ctx.db.patch(orgCredits._id, {
      balance: monthlyIncluded,
      monthlyUsed: 0,
      monthlyIncluded: monthlyIncluded,
      monthlyResetAt: nextMonth.getTime(),
      lifetimeCreditsGranted:
        orgCredits.lifetimeCreditsGranted + monthlyIncluded,
      // bonusCredits intentionally NOT touched -- they persist
      updatedAt: Date.now(),
    });

    console.log(
      `[BILLING] Reset AI credits for org ${args.organizationId}: balance=${monthlyIncluded}, monthlyUsed=0`,
    );
  },
});

/**
 * Lay tat ca ban ghi credit AI / Get all AI credits records
 *
 * Returns all aiCredits records for the monthly reset orchestrator.
 */
export const getAllAiCreditsRecords = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("aiCredits").collect();
  },
});
