/**
 * Types for admin billing feature.
 *
 * vi: "Kieu du lieu cho tinh nang thanh toan admin"
 * en: "Types for admin billing feature"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */

import type { Id } from "@medilink/backend";

/** Organization subscription status */
export type OrgSubscriptionStatus =
  | "active"
  | "trial"
  | "grace_period"
  | "expired"
  | "suspended";

/** Subscription plan type */
export type SubscriptionPlan =
  | "starter"
  | "professional"
  | "enterprise"
  | "trial";

/** Billing cycle */
export type BillingCycle = "monthly_3" | "monthly_6" | "monthly_12";

/** Organization with subscription info for list view */
export interface OrganizationSubscriptionRow {
  _id: Id<"organizations">;
  name: string;
  slug: string;
  status: OrgSubscriptionStatus;
  subscriptionPlan: SubscriptionPlan | null;
  billingCycle: BillingCycle | null;
  subscriptionExpiresAt: number | null;
  gracePeriodEndsAt: number | null;
  maxStaffSeats: number | null;
  maxEquipment: number | null;
  staffCount: number;
  equipmentCount: number;
  createdAt: number;
}

/** Subscription history record */
export interface SubscriptionRecord {
  _id: Id<"subscriptions">;
  plan: SubscriptionPlan;
  billingCycle: string;
  startDate: number;
  endDate: number;
  amountVnd: number;
  status: string;
  monthlyAiCredits: number;
  activatedBy: Id<"users"> | null;
  activatedAt: number | null;
  notes: string | null;
  createdAt: number;
}

/** Payment history record */
export interface PaymentRecord {
  _id: Id<"payments">;
  amountVnd: number;
  paymentMethod: string;
  status: string;
  paymentType: string;
  bankReference: string | null;
  confirmedAt: number | null;
  notes: string | null;
  createdAt: number;
}

/** AI Credits summary */
export interface AiCreditsSummary {
  balance: number;
  monthlyIncluded: number;
  monthlyUsed: number;
  bonusCredits: number;
  monthlyResetAt: number;
}

/** Full billing detail for an org */
export interface OrganizationBillingDetail {
  organization: {
    _id: Id<"organizations">;
    name: string;
    slug: string;
    status: string;
    subscriptionPlan: SubscriptionPlan | null;
    billingCycle: BillingCycle | null;
    subscriptionStartDate: number | null;
    subscriptionExpiresAt: number | null;
    gracePeriodEndsAt: number | null;
    maxStaffSeats: number | null;
    maxEquipment: number | null;
    createdAt: number;
  };
  staffCount: number;
  equipmentCount: number;
  subscriptionHistory: SubscriptionRecord[];
  paymentHistory: PaymentRecord[];
  aiCredits: AiCreditsSummary | null;
}

/** Status filter options for the list view */
export type StatusFilter =
  | "all"
  | "active"
  | "trial"
  | "grace_period"
  | "expired"
  | "suspended";
