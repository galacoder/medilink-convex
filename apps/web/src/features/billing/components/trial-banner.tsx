/**
 * Trial period countdown banner.
 *
 * WHY: Shows a non-intrusive blue banner when less than 7 days remain
 * in the trial period, prompting the user to upgrade before expiry.
 *
 * Only visible when daysRemaining <= 7 to avoid banner fatigue.
 *
 * vi: "Banner dem nguoc thoi gian dung thu"
 * en: "Trial period countdown banner"
 */
"use client";

import { Button } from "@medilink/ui/button";

import { BILLING_LABELS } from "../labels";

interface TrialBannerProps {
  /** Subscription expiry timestamp (ms) */
  expiresAt: number;
}

export function TrialBanner({ expiresAt }: TrialBannerProps) {
  const daysRemaining = Math.ceil(
    (expiresAt - Date.now()) / (1000 * 60 * 60 * 24),
  );

  // Only show when <7 days remain (or exactly 7)
  if (daysRemaining > 7) return null;

  const trialText = BILLING_LABELS.trialRemaining(daysRemaining);

  return (
    <div className="border-b border-blue-200 bg-blue-50 px-4 py-2">
      <p className="text-center text-sm text-blue-700">
        {trialText.vi} / {trialText.en}{" "}
        <Button variant="link" className="h-auto p-0 text-blue-700 underline">
          {BILLING_LABELS.trialUpgradeCta.vi} /{" "}
          {BILLING_LABELS.trialUpgradeCta.en}
        </Button>
      </p>
    </div>
  );
}
