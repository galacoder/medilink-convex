/**
 * AI action button with credit cost label.
 *
 * WHY: Every AI-powered button displays the credit cost. When the user
 * has insufficient credits, clicking the button opens the insufficient
 * credits modal instead of executing the action.
 *
 * vi: "Nut hanh dong AI co nhan gia credit"
 * en: "AI action button with credit cost label"
 *
 * @see Issue #177 -- M1-8: AI Credit Balance UI
 */
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Sparkles } from "lucide-react";

import type { Id } from "@medilink/backend";
import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";

import type { AiFeatureId } from "../../../../../../convex/billing/creditCosts";
import type { AiCreditBalance } from "../lib/credit-api";
import { AI_CREDIT_COSTS } from "../../../../../../convex/billing/creditCosts";
import { creditQueriesApi } from "../lib/credit-api";
import { InsufficientCreditsModal } from "./insufficient-credits-modal";

interface AiActionButtonProps {
  featureId: AiFeatureId;
  onClick: () => void;
  children: React.ReactNode;
  organizationId: Id<"organizations">;
  disabled?: boolean;
}

export function AiActionButton({
  featureId,
  onClick,
  children,
  organizationId,
  disabled,
}: AiActionButtonProps) {
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  const credits = useQuery(creditQueriesApi.getAiCreditBalance, {
    organizationId,
  }) as AiCreditBalance | undefined;

  const costConfig = AI_CREDIT_COSTS[featureId];
  const cost = costConfig.credits;
  const hasEnough = credits ? credits.totalAvailable >= cost : false;

  function handleClick() {
    if (hasEnough) {
      onClick();
    } else {
      setShowInsufficientModal(true);
    }
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled ?? !credits}
        variant={hasEnough ? "default" : "outline"}
        className="relative"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {children}
        <Badge variant="secondary" className="ml-2 text-xs">
          {cost} credit{cost !== 1 ? "s" : ""}
        </Badge>
      </Button>

      <InsufficientCreditsModal
        open={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        required={cost}
        available={credits?.totalAvailable ?? 0}
        featureLabel={costConfig.description}
        featureLabelVi={costConfig.descriptionVi}
      />
    </>
  );
}
