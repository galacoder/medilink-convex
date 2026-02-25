/**
 * Billing feature type definitions.
 *
 * WHY: Centralizes subscription-related types used across all billing
 * UI components. Matches the organization status enum from the Convex
 * schema (convex/schema.ts).
 *
 * vi: "Dinh nghia kieu cho tinh nang thanh toan"
 * en: "Type definitions for billing feature"
 */

/**
 * Organization subscription status values.
 * Matches the status field in the organizations table.
 */
export type SubscriptionStatus =
  | "active"
  | "trial"
  | "grace_period"
  | "expired"
  | "suspended";

/**
 * Subscription plan tiers.
 * Matches the subscriptionPlan field in the organizations table.
 */
export type SubscriptionPlan =
  | "starter"
  | "professional"
  | "enterprise"
  | "trial";

/**
 * Billing cycle options.
 * Matches the billingCycle field in the organizations table.
 */
export type BillingCycle = "monthly_3" | "monthly_6" | "monthly_12";

/**
 * Return type for the useSubscriptionStatus hook.
 */
export interface SubscriptionStatusInfo {
  /** Current subscription status */
  status: SubscriptionStatus;
  /** Current plan tier */
  plan: SubscriptionPlan | undefined;
  /** Subscription expiry timestamp (ms) */
  expiresAt: number | undefined;
  /** Grace period end timestamp (ms) */
  gracePeriodEndsAt: number | undefined;
  /** Whether the org has full access (active or trial) */
  isActive: boolean;
  /** Whether the org is in read-only mode (grace_period) */
  isReadOnly: boolean;
  /** Whether the org is fully blocked (expired or suspended) */
  isBlocked: boolean;
  /** Days until subscription expires (null if no expiry date) */
  daysUntilExpiry: number | null;
}
