/**
 * Hook to derive subscription status from organization data.
 *
 * WHY: Multiple billing UI components (badge, banners, overlays, gates)
 * need the same derived state. This hook centralizes the logic so each
 * component doesn't duplicate status checks.
 *
 * Accepts org data as a parameter (not queried internally) so it's
 * composable with any data source (Convex useQuery, SSR, tests).
 *
 * vi: "Hook tinh trang thai dang ky tu du lieu to chuc"
 * en: "Hook to derive subscription status from org data"
 */
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionStatusInfo,
} from "../types";

/**
 * Subset of organization fields needed to compute subscription status.
 * Matches the relevant fields from the Convex organizations table.
 */
export interface OrgSubscriptionData {
  status?: SubscriptionStatus;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionExpiresAt?: number;
  gracePeriodEndsAt?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Derives subscription status info from organization data.
 *
 * @param org - Organization data (null when org not loaded or not found)
 * @returns Derived subscription state for UI components
 */
export function useSubscriptionStatus(
  org: OrgSubscriptionData | null | undefined,
): SubscriptionStatusInfo {
  // Null org = no org found, treat as expired (blocked)
  if (!org) {
    return {
      status: "expired" as const,
      plan: undefined,
      expiresAt: undefined,
      gracePeriodEndsAt: undefined,
      isActive: false,
      isReadOnly: false,
      isBlocked: true,
      daysUntilExpiry: null,
    };
  }

  // Legacy orgs without status field are treated as active
  // (matches billing guard: "undefined (legacy) -> treated as active")
  const status: SubscriptionStatus = org.status ?? "active";

  const isActive = status === "active" || status === "trial";
  const isReadOnly = status === "grace_period";
  const isBlocked = status === "expired" || status === "suspended";

   
  const nowMs = Date.now();
  const daysUntilExpiry = org.subscriptionExpiresAt
    ? Math.ceil((org.subscriptionExpiresAt - nowMs) / DAY_MS)
    : null;

  return {
    status,
    plan: org.subscriptionPlan,
    expiresAt: org.subscriptionExpiresAt,
    gracePeriodEndsAt: org.gracePeriodEndsAt,
    isActive,
    isReadOnly,
    isBlocked,
    daysUntilExpiry,
  };
}
