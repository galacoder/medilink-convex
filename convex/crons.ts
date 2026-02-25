/**
 * Convex cron job schedule configuration.
 *
 * Registers all recurring background jobs.
 *
 * vi: "Cau hinh lich cron Convex" / en: "Convex cron job schedule configuration"
 *
 * @see Issue #176 — M1-7: Subscription Expiry Cron Job
 */

import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// ---------------------------------------------------------------------------
// Billing: Daily subscription expiry check
// ---------------------------------------------------------------------------

// Kiem tra het han dang ky hang ngay / Daily subscription expiry check
// Chay moi ngay luc 00:00 UTC / Runs daily at 00:00 UTC
crons.daily(
  "daily subscription expiry check",
  { hourUTC: 0, minuteUTC: 0 },
  internal.billing.crons.dailySubscriptionCheck,
);

export default crons;
