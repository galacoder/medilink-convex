/**
 * Billing error constants for subscription and AI credit guards.
 *
 * WHY: Centralizes all billing-related error codes and bilingual messages
 * for consistent client-side error handling across the application.
 *
 * vi: "Hang so loi thanh toan" / en: "Billing error constants"
 */

export const BILLING_ERRORS = {
  // Loi dang ky / Subscription errors
  ORG_NOT_FOUND: {
    code: "ORG_NOT_FOUND" as const,
    message: "Organization not found",
    messageVi: "Khong tim thay to chuc",
  },
  SUBSCRIPTION_INACTIVE: {
    code: "SUBSCRIPTION_INACTIVE" as const,
    message: "Subscription is inactive",
    messageVi: "Dang ky khong hoat dong",
  },
  SUBSCRIPTION_GRACE_PERIOD: {
    code: "SUBSCRIPTION_GRACE_PERIOD" as const,
    message: "Subscription in grace period (read-only)",
    messageVi: "Dang ky trong thoi gian gia han (chi doc)",
  },

  // Loi credit AI / AI credit errors
  NO_CREDITS_RECORD: {
    code: "NO_CREDITS_RECORD" as const,
    message: "AI credits not initialized",
    messageVi: "Credit AI chua duoc khoi tao",
  },
  INSUFFICIENT_CREDITS: {
    code: "INSUFFICIENT_CREDITS" as const,
    message: "Insufficient AI credits",
    messageVi: "Khong du credit AI",
  },
} as const;
