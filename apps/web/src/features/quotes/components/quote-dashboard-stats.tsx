"use client";

/**
 * QuoteDashboardStats component — summary stats for the provider quotes page.
 *
 * WHY: Providers need a quick overview of their quoting performance before
 * drilling into individual quotes. The win rate is a key KPI that helps
 * providers understand their competitiveness in the marketplace.
 *
 * Win rate = accepted / (accepted + rejected) × 100%
 * Shows "N/A" when no decided quotes exist yet (no divide-by-zero).
 */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import { quoteLabels } from "../labels";
import type { QuoteDashboardStats as QuoteDashboardStatsType } from "../types";

interface QuoteDashboardStatsProps {
  stats: QuoteDashboardStatsType;
}

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
}

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function QuoteDashboardStats({ stats }: QuoteDashboardStatsProps) {
  const winRateDisplay =
    stats.winRate === -1 ? "N/A" : `${stats.winRate}%`;

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      data-testid="quote-dashboard-stats"
    >
      <StatCard
        label={quoteLabels.dashboard.pendingQuotes.vi}
        value={stats.pendingCount}
        description={quoteLabels.dashboard.pendingQuotes.en}
      />
      <StatCard
        label={quoteLabels.dashboard.acceptedQuotes.vi}
        value={stats.acceptedCount}
        description={quoteLabels.dashboard.acceptedQuotes.en}
      />
      <StatCard
        label={quoteLabels.dashboard.winRate.vi}
        value={winRateDisplay}
        description={
          stats.winRate === -1
            ? "Chưa có dữ liệu (No data yet)"
            : `${stats.acceptedCount}/${stats.acceptedCount + stats.rejectedCount} ${quoteLabels.dashboard.winRate.en}`
        }
      />
    </div>
  );
}
