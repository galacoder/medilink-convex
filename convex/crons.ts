/**
 * Convex cron job definitions.
 *
 * WHY: Centralized cron scheduler for periodic tasks. Each cron job
 * delegates to an internalAction handler in the relevant domain module.
 *
 * vi: "Dinh nghia cron job"
 * en: "Cron job definitions"
 */

import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// Reset credit AI hang thang / Monthly AI credit reset
// Chay vao ngay 1 moi thang luc 00:00 UTC
// Runs on the 1st of every month at 00:00 UTC
crons.monthly(
  "monthly AI credit reset",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.billing.crons.monthlyAiCreditReset,
);

export default crons;
