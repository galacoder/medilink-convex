/**
 * AI credit balance dashboard widget.
 *
 * WHY: Provides hospital staff with a clear overview of their AI credit
 * balance, usage, bonus credits, and reset date. Uses color-coded progress
 * bar to indicate balance health at a glance.
 *
 * vi: "Widget so du credit AI tren dashboard"
 * en: "AI credit balance dashboard widget"
 *
 * @see Issue #177 -- M1-8: AI Credit Balance UI
 */
"use client";

import { useQuery } from "convex/react";
import { Sparkles } from "lucide-react";

import type { Id } from "@medilink/backend";
import { Button } from "@medilink/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@medilink/ui/card";
import { Progress } from "@medilink/ui/progress";
import { Skeleton } from "@medilink/ui/skeleton";

import type { AiCreditBalance } from "../lib/credit-api";
import { creditQueriesApi } from "../lib/credit-api";
import { getBalanceState } from "../lib/credit-balance-state";

interface CreditBalanceWidgetProps {
  organizationId: Id<"organizations">;
}

function CreditBalanceSkeleton() {
  return (
    <Card data-testid="credit-balance-skeleton">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="mt-3 space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="mt-3 h-8 w-full" />
      </CardContent>
    </Card>
  );
}

export function CreditBalanceWidget({
  organizationId,
}: CreditBalanceWidgetProps) {
  const credits = useQuery(creditQueriesApi.getAiCreditBalance, {
    organizationId,
  }) as AiCreditBalance | undefined;

  if (!credits) return <CreditBalanceSkeleton />;

  const usagePercent =
    credits.monthlyIncluded > 0
      ? (credits.monthlyUsed / credits.monthlyIncluded) * 100
      : 0;

  const remainingPercent = 100 - usagePercent;
  const balanceState = getBalanceState(remainingPercent);

  const locale = "vi" as string;
  const resetDate = new Date(credits.monthlyResetAt).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US",
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Credit AI / AI Credits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress bar with color */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={balanceState.textClass}>
              {credits.balance} / {credits.monthlyIncluded}
            </span>
            <span className="text-muted-foreground">
              {Math.round(remainingPercent)}% con lai / remaining
            </span>
          </div>
          <Progress
            value={remainingPercent}
            className={balanceState.barClass}
          />
        </div>

        {/* Stats */}
        <div className="text-muted-foreground mt-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Da dung thang nay / Used this month:</span>
            <span>{credits.monthlyUsed}</span>
          </div>
          {credits.bonusCredits > 0 && (
            <div className="flex justify-between">
              <span>Bonus credits:</span>
              <span>{credits.bonusCredits}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Reset:</span>
            <span>{resetDate}</span>
          </div>
        </div>

        {/* View history link */}
        <Button variant="ghost" size="sm" className="mt-3 w-full text-xs">
          Xem lich su / View history
        </Button>
      </CardContent>
    </Card>
  );
}
