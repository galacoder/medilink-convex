"use client";

/**
 * Card component for displaying provider service completion rate.
 *
 * WHY: The completion rate is a key KPI that helps providers understand
 * how well they are fulfilling accepted service requests. Displaying it
 * prominently with the raw counts provides actionable context.
 *
 * vi: "Thẻ tỷ lệ hoàn thành" / en: "Completion rate card"
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

interface CompletionRateCardProps {
  /** Completion rate as a decimal (0–1), e.g. 0.85 = 85% */
  completionRate: number;
  /** Total count of completed service requests in the period */
  completedServices: number;
  /** Total services (completed + cancelled) used as denominator */
  totalServices: number;
  isLoading: boolean;
}

/**
 * Displays the completion rate percentage with a progress indicator.
 */
export function CompletionRateCard({
  completionRate,
  completedServices,
  totalServices,
  isLoading,
}: CompletionRateCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="bg-muted h-4 w-32 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-8 w-16 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const percentage = Math.round(completionRate * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>
          {/* vi: "Tỷ lệ hoàn thành" / en: "Completion Rate" */}
          Tỷ lệ hoàn thành
        </CardDescription>
        <CardTitle className="text-3xl">{percentage}%</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs">
          {/* vi: "X / Y dịch vụ hoàn thành" / en: "X / Y services completed" */}
          {completedServices} / {totalServices} dịch vụ
        </p>
        {/* Progress bar */}
        <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
