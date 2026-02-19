"use client";

/**
 * Platform health metrics card for the platform admin analytics dashboard.
 *
 * Shows average quote response time and average dispute resolution time.
 *
 * WHY: Platform admins need to monitor whether providers are responding to
 * service requests quickly and whether disputes are being resolved efficiently.
 * These are leading indicators of platform quality.
 *
 * vi: "Thẻ sức khỏe nền tảng" / en: "Platform health card"
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { PlatformHealthMetrics } from "../types";
import { adminAnalyticsLabels } from "../labels";

interface PlatformHealthCardProps {
  healthMetrics: PlatformHealthMetrics | null;
  isLoading: boolean;
}

/**
 * Formats days as a human-readable string.
 * e.g. 1.5 → "1.5 ngày" / 0 → "0 ngày"
 */
function formatDays(days: number, suffix: string): string {
  return `${days.toFixed(1)} ${suffix}`;
}

/**
 * Displays platform health KPI cards for quote response and dispute resolution times.
 */
export function PlatformHealthCard({
  healthMetrics,
  isLoading,
}: PlatformHealthCardProps) {
  const labels = adminAnalyticsLabels.health;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {/* vi: "Sức khỏe nền tảng" / en: "Platform Health" */}
          {labels.title.vi}
        </CardTitle>
        <CardDescription>
          {/* vi: "Thời gian phản hồi và giải quyết tranh chấp" */}
          {/* en: "Response and dispute resolution times" */}
          Thời gian phản hồi và giải quyết tranh chấp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Avg quote response time */}
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-muted-foreground text-sm">
              {/* vi: "Thời gian phản hồi báo giá TB" / en: "Avg Quote Response Time" */}
              {labels.avgQuoteResponseTime.vi}
            </p>
            <p className="mt-1 text-2xl font-semibold text-blue-700">
              {isLoading ? (
                <span className="text-muted-foreground">--</span>
              ) : (
                formatDays(
                  healthMetrics?.avgQuoteResponseTimeDays ?? 0,
                  labels.days.vi /* en: "days" */,
                )
              )}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {/* vi: "Từ khi tạo yêu cầu đến khi nhận báo giá" */}
              {/* en: "From request creation to first quote received" */}
              Từ khi tạo yêu cầu đến khi nhận báo giá
            </p>
          </div>

          {/* Avg dispute resolution time */}
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-muted-foreground text-sm">
              {/* vi: "Thời gian giải quyết tranh chấp TB" / en: "Avg Dispute Resolution Time" */}
              {labels.avgDisputeResolutionTime.vi}
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">
              {isLoading ? (
                <span className="text-muted-foreground">--</span>
              ) : (
                formatDays(
                  healthMetrics?.avgDisputeResolutionTimeDays ?? 0,
                  labels.days.vi /* en: "days" */,
                )
              )}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {/* vi: "Từ khi mở tranh chấp đến khi giải quyết" */}
              {/* en: "From dispute opened to resolved" */}
              Từ khi mở tranh chấp đến khi giải quyết
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
