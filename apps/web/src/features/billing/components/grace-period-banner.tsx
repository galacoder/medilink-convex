/**
 * Grace period warning banner displayed across the top of every page.
 *
 * WHY: During grace period (7 days after subscription expiry), users
 * have read-only access. This prominent amber banner communicates
 * the urgency and provides a contact CTA for renewal.
 *
 * Placed in the hospital layout, sticky to the top of the viewport.
 *
 * vi: "Banner canh bao thoi gian gia han"
 * en: "Grace period warning banner"
 */
"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@medilink/ui/button";

import { BILLING_LABELS } from "../labels";

interface GracePeriodBannerProps {
  /** Timestamp (ms) when grace period ends */
  gracePeriodEndsAt: number;
}

export function GracePeriodBanner({
  gracePeriodEndsAt,
}: GracePeriodBannerProps) {
  const daysRemaining = Math.ceil(
    (gracePeriodEndsAt - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const description = BILLING_LABELS.gracePeriodDescription(daysRemaining);

  return (
    <div className="sticky top-0 z-40 border-b border-amber-200 bg-amber-50 px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            {BILLING_LABELS.gracePeriodTitle.vi} /{" "}
            {BILLING_LABELS.gracePeriodTitle.en}
          </p>
          <p className="text-sm text-amber-700">
            {description.vi} / {description.en}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-amber-600 text-amber-700"
        >
          {BILLING_LABELS.gracePeriodCta.vi} /{" "}
          {BILLING_LABELS.gracePeriodCta.en}
        </Button>
      </div>
    </div>
  );
}
