/**
 * Convex cron job definitions for M5-2 — Workflow Automation.
 *
 * Schedules automation rules to run on a recurring basis.
 * These replace the legacy recipe-builder plugin with simpler,
 * hardcoded Convex cron rules.
 *
 * Schedule summary:
 *   - checkOverdueRequests:    Every hour (at :30 past the hour)
 *   - checkMaintenanceDue:     Daily at 08:00 UTC
 *   - checkStockLevels:        Daily at 09:00 UTC
 *   - checkCertificationExpiry: Weekly on Monday at 07:00 UTC
 *
 * WHY: Convex crons are the idiomatic way to run background tasks in Convex.
 * They are simpler and more reliable than the legacy event-bus recipe builder:
 *   - No external scheduler or queue needed
 *   - Crons survive server restarts (Convex manages scheduling state)
 *   - Automatic retry on failure
 *   - Visible in Convex dashboard under "Scheduled Functions"
 *
 * Multi-tenancy: Each rule function iterates over all organizations internally.
 * No per-org cron scheduling — one global cron calls a rule that processes
 * every org in isolation.
 *
 * vi: "Định nghĩa công việc định kỳ Convex" / en: "Convex cron job definitions"
 */

import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// ---------------------------------------------------------------------------
// Cron 1: Check Overdue Service Requests (hourly)
// vi: "Kiểm tra yêu cầu dịch vụ quá hạn — mỗi giờ"
// en: "Check overdue service requests — hourly"
// ---------------------------------------------------------------------------

/**
 * Run every hour at :30 past the hour.
 * Flags service requests stuck in a non-terminal status > 7 days.
 *
 * WHY hourly: Service request escalation is time-sensitive. A 1-hour
 * detection window balances responsiveness with database load.
 */
crons.hourly(
  "check-overdue-requests",
  { minuteUTC: 30 },
  internal.automation.rules.checkOverdueRequests,
);

// ---------------------------------------------------------------------------
// Cron 2: Check Maintenance Due (daily)
// vi: "Kiểm tra bảo trì sắp đến hạn — hàng ngày"
// en: "Check maintenance due — daily"
// ---------------------------------------------------------------------------

/**
 * Run every day at 08:00 UTC (15:00 Vietnam time).
 * Flags equipment with maintenance due within the next 7 days.
 *
 * WHY daily at 08:00 UTC: Morning UTC = afternoon Vietnam time.
 * Maintenance reminders arrive during the business day for SPMET staff,
 * giving them time to schedule technicians before the day ends.
 */
crons.daily(
  "check-maintenance-due",
  { hourUTC: 8, minuteUTC: 0 },
  internal.automation.rules.checkMaintenanceDue,
);

// ---------------------------------------------------------------------------
// Cron 3: Check Stock Levels (daily)
// vi: "Kiểm tra mức tồn kho vật tư — hàng ngày"
// en: "Check consumable stock levels — daily"
// ---------------------------------------------------------------------------

/**
 * Run every day at 09:00 UTC (16:00 Vietnam time).
 * Flags consumables with currentStock below reorderPoint.
 *
 * WHY daily at 09:00 UTC: Stock checks run after maintenance checks (08:00)
 * so admin notifications are batched. 09:00 UTC = 16:00 Vietnam time.
 */
crons.daily(
  "check-stock-levels",
  { hourUTC: 9, minuteUTC: 0 },
  internal.automation.rules.checkStockLevels,
);

// ---------------------------------------------------------------------------
// Cron 4: Check Certification Expiry (weekly)
// vi: "Kiểm tra chứng nhận hết hạn — hàng tuần"
// en: "Check certification expiry — weekly"
// ---------------------------------------------------------------------------

/**
 * Run every Monday at 07:00 UTC (14:00 Vietnam time).
 * Flags provider certifications expiring within 30 days.
 *
 * WHY weekly: Certification renewal takes time (days to weeks). A 30-day
 * warning with weekly checks provides 4 opportunities to catch expiry
 * before it becomes critical. Weekly reduces noise vs daily.
 */
crons.weekly(
  "check-certification-expiry",
  { dayOfWeek: "monday", hourUTC: 7, minuteUTC: 0 },
  internal.automation.rules.checkCertificationExpiry,
);

export default crons;
