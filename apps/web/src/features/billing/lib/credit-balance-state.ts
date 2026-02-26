/**
 * Color-coded balance state logic for AI credit UI.
 *
 * WHY: Maps remaining credit percentage to visual indicators (color, icon).
 * Used by CreditBalanceWidget, CreditIndicator, and AiActionButton
 * to consistently show balance health across the entire UI.
 *
 * vi: "Logic trang thai so du credit AI"
 * en: "Balance state logic for AI credit UI"
 *
 * @see Issue #177 -- M1-8: AI Credit Balance UI
 */

export interface BalanceState {
  /** Balance health level */
  level: "healthy" | "warning" | "critical" | "empty";
  /** Tailwind text color class */
  textClass: string;
  /** Tailwind progress bar color class (targets child indicator div) */
  barClass: string;
  /** Lucide icon name, or null when no icon needed */
  icon: string | null;
}

/**
 * Determine the visual state for a credit balance.
 *
 * | Remaining % | State    | Color   |
 * |-------------|----------|---------|
 * | > 50%       | healthy  | emerald |
 * | 20% - 50%   | warning  | amber   |
 * | 1% - 19%    | critical | red     |
 * | <= 0%       | empty    | red+bold|
 */
export function getBalanceState(remainingPercent: number): BalanceState {
  if (remainingPercent <= 0) {
    return {
      level: "empty",
      textClass: "text-red-600 font-bold",
      barClass: "[&>div]:bg-red-500",
      icon: "XCircle",
    };
  }
  if (remainingPercent < 20) {
    return {
      level: "critical",
      textClass: "text-red-600",
      barClass: "[&>div]:bg-red-500",
      icon: "AlertTriangle",
    };
  }
  if (remainingPercent <= 50) {
    return {
      level: "warning",
      textClass: "text-amber-600",
      barClass: "[&>div]:bg-amber-500",
      icon: "AlertTriangle",
    };
  }
  return {
    level: "healthy",
    textClass: "text-emerald-600",
    barClass: "[&>div]:bg-emerald-500",
    icon: null,
  };
}
