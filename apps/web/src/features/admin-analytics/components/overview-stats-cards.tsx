"use client";

/**
 * Overview statistics cards for the platform admin analytics dashboard.
 *
 * WHY: Platform admins need a quick snapshot of platform-wide metrics at the top
 * of the dashboard. The 5-card layout shows hospitals, providers, equipment,
 * service requests, and total revenue.
 *
 * vi: "Thẻ thống kê tổng quan" / en: "Overview statistics cards"
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { PlatformOverviewStats } from "../types";
import { adminAnalyticsLabels } from "../labels";

interface OverviewStatsCardsProps {
  stats: PlatformOverviewStats | null;
  isLoading: boolean;
}

/**
 * Formats a VND amount to a compact string for KPI cards.
 * e.g. 1000000 → "1Tr VND"
 */
function formatVNDShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}Tỷ VND`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}Tr VND`;
  }
  return `${amount.toLocaleString("vi-VN")} VND`;
}

function StatCard({
  label,
  value,
  isLoading,
  description,
}: {
  label: { vi: string; en: string };
  value: string | number;
  isLoading: boolean;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>
          {/* Primary Vietnamese label */}
          {label.vi}
          {/* Secondary English label */}
          <span className="text-muted-foreground/60 ml-1 text-xs">
            {/* en: label.en */}
          </span>
        </CardDescription>
        <CardTitle className="text-3xl">
          {isLoading ? (
            <span className="text-muted-foreground">--</span>
          ) : (
            value
          )}
        </CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-muted-foreground text-xs">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Renders the 5 platform KPI overview cards.
 */
export function OverviewStatsCards({
  stats,
  isLoading,
}: OverviewStatsCardsProps) {
  const labels = adminAnalyticsLabels.overview;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[...Array<number>(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="bg-muted h-4 w-24 animate-pulse rounded" />
              <div className="bg-muted mt-2 h-8 w-16 animate-pulse rounded" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label={labels.totalHospitals}
        value={stats?.totalHospitals ?? 0}
        isLoading={false}
        description={
          /* vi: "Bệnh viện đã đăng ký" / en: "Registered hospitals" */
          "Bệnh viện đã đăng ký"
        }
      />
      <StatCard
        label={labels.totalProviders}
        value={stats?.totalProviders ?? 0}
        isLoading={false}
        description={
          /* vi: "Nhà cung cấp dịch vụ" / en: "Service providers" */
          "Nhà cung cấp dịch vụ"
        }
      />
      <StatCard
        label={labels.totalEquipment}
        value={stats?.totalEquipment ?? 0}
        isLoading={false}
        description={
          /* vi: "Thiết bị đang quản lý" / en: "Equipment being managed" */
          "Thiết bị đang quản lý"
        }
      />
      <StatCard
        label={labels.totalServiceRequests}
        value={stats?.totalServiceRequests ?? 0}
        isLoading={false}
        description={
          /* vi: "Tổng yêu cầu dịch vụ" / en: "Total service requests" */
          "Tổng yêu cầu dịch vụ"
        }
      />
      <StatCard
        label={labels.totalRevenue}
        value={formatVNDShort(stats?.totalRevenue ?? 0)}
        isLoading={false}
        description={
          /* vi: "Từ dịch vụ đã hoàn thành" / en: "From completed services" */
          "Từ dịch vụ đã hoàn thành"
        }
      />
    </div>
  );
}
