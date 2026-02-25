/**
 * Compact AI credit balance indicator for the navbar.
 *
 * WHY: Provides a small, always-visible credit balance in the main
 * navigation bar. Color-coded to match the balance state, with tooltip
 * showing detailed usage on hover.
 *
 * vi: "Chi bao credit AI tren thanh dieu huong"
 * en: "Compact AI credit indicator for navbar"
 *
 * @see Issue #177 -- M1-8: AI Credit Balance UI
 */
"use client";

import { useQuery } from "convex/react";
import { Sparkles } from "lucide-react";

import type { Id } from "@medilink/backend";
import { cn } from "@medilink/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@medilink/ui/tooltip";

import type { AiCreditBalance } from "../lib/credit-api";
import { creditQueriesApi } from "../lib/credit-api";
import { getBalanceState } from "../lib/credit-balance-state";

interface CreditIndicatorProps {
  organizationId: Id<"organizations">;
}

export function CreditIndicator({ organizationId }: CreditIndicatorProps) {
  const credits = useQuery(creditQueriesApi.getAiCreditBalance, {
    organizationId,
  }) as AiCreditBalance | undefined;

  if (!credits) return null;

  const remainingPercent =
    credits.monthlyIncluded > 0
      ? (credits.balance / credits.monthlyIncluded) * 100
      : 0;
  const state = getBalanceState(remainingPercent);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-testid="credit-indicator"
            className={cn("flex items-center gap-1 text-sm", state.textClass)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-medium">{credits.totalAvailable}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{credits.totalAvailable} credits con lai / remaining</p>
          <p className="text-muted-foreground text-xs">
            {credits.monthlyUsed} / {credits.monthlyIncluded} da dung thang nay
            / used this month
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
