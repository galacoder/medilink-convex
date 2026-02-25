/**
 * Utility functions for the admin billing payment feature.
 *
 * vi: "Ham tien ich thanh toan" / en: "Payment utility functions"
 */

/**
 * Format a VND amount with thousands separator and currency symbol.
 *
 * vi: "Dinh dang so tien VND" / en: "Format VND amount"
 *
 * @example formatVnd(10800000) => "10.800.000 ₫"
 */
export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a Unix timestamp (ms) to a localized date string.
 *
 * vi: "Dinh dang ngay" / en: "Format date"
 */
export function formatDate(
  timestamp: number,
  locale: "vi" | "en" = "vi",
): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

/**
 * Format a Unix timestamp (ms) to a localized date-time string.
 *
 * vi: "Dinh dang ngay gio" / en: "Format date-time"
 */
export function formatDateTime(
  timestamp: number,
  locale: "vi" | "en" = "vi",
): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
