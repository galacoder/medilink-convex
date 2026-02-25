/**
 * Subscription gate component that controls child visibility/interactivity.
 *
 * WHY: During grace period, mutation buttons should be disabled with
 * a tooltip explaining why. For expired/suspended, they are hidden entirely.
 * This gate wraps any interactive elements that require an active subscription.
 *
 * Usage:
 *   <SubscriptionGate status={subscriptionStatus}>
 *     <Button onClick={createEquipment}>Add Equipment</Button>
 *   </SubscriptionGate>
 *
 * vi: "Cong kiem soat dang ky cho cac thanh phan tuong tac"
 * en: "Subscription gate for interactive elements"
 */
"use client";

import type { ReactNode } from "react";

import type { SubscriptionStatus } from "../types";
import { BILLING_LABELS } from "../labels";

interface SubscriptionGateProps {
  /** Current subscription status */
  status: SubscriptionStatus;
  /** Interactive elements to gate */
  children: ReactNode;
  /** Optional fallback for blocked states (expired/suspended) */
  fallback?: ReactNode;
}

export function SubscriptionGate({
  status,
  children,
  fallback,
}: SubscriptionGateProps) {
  // Active and trial: full access, render children as-is
  if (status === "active" || status === "trial") {
    return <>{children}</>;
  }

  // Grace period: disabled with tooltip explaining read-only mode
  if (status === "grace_period") {
    return (
      <div className="relative inline-block">
        <div
          data-testid="subscription-gate-disabled"
          data-disabled="true"
          className="pointer-events-none opacity-50"
        >
          {children}
        </div>
        <span className="text-muted-foreground mt-1 block text-xs">
          {BILLING_LABELS.readOnlyTooltip.vi} /{" "}
          {BILLING_LABELS.readOnlyTooltip.en}
        </span>
      </div>
    );
  }

  // Expired or suspended: hide children entirely, show fallback
  return <>{fallback ?? null}</>;
}
