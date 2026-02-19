"use client";

/**
 * Revenue breakdown table for the platform admin analytics dashboard.
 *
 * Shows top hospitals and providers by revenue in a two-column layout.
 *
 * WHY: Platform admins need to see which hospitals and providers are generating
 * the most revenue to identify key accounts and prioritize support resources.
 *
 * vi: "Bảng phân tích doanh thu" / en: "Revenue breakdown table"
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { HospitalRevenueEntry, ProviderRevenueEntry } from "../types";
import { adminAnalyticsLabels } from "../labels";

interface RevenueBreakdownTableProps {
  revenueByHospital: HospitalRevenueEntry[];
  revenueByProvider: ProviderRevenueEntry[];
  totalRevenue: number;
  averageServiceValue: number;
  isLoading: boolean;
}

/**
 * Formats a VND amount to a compact string.
 */
function formatVNDCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}Tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)}Tr`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return String(amount);
}

/**
 * Revenue breakdown showing top hospitals and providers by revenue.
 */
export function RevenueBreakdownTable({
  revenueByHospital,
  revenueByProvider,
  totalRevenue,
  averageServiceValue,
  isLoading,
}: RevenueBreakdownTableProps) {
  const labels = adminAnalyticsLabels.revenue;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="bg-muted h-5 w-40 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array<number>(3)].map((_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="bg-muted h-5 w-40 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array<number>(3)].map((_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Revenue KPI row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {/* vi: "Tổng doanh thu" / en: "Total Revenue" */}
              {labels.totalRevenue.vi}
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatVNDCompact(totalRevenue)} VND
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {/* vi: "Từ các dịch vụ đã hoàn thành" / en: "From completed services" */}
              Từ các dịch vụ đã hoàn thành
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {/* vi: "Giá trị dịch vụ trung bình" / en: "Average Service Value" */}
              {labels.averageServiceValue.vi}
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatVNDCompact(averageServiceValue)} VND
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {/* vi: "Mỗi yêu cầu dịch vụ hoàn thành" / en: "Per completed service request" */}
              Mỗi yêu cầu dịch vụ hoàn thành
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top hospitals and providers by revenue */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Hospital */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {/* vi: "Doanh thu theo bệnh viện" / en: "Revenue by Hospital" */}
              {labels.revenueByHospital.vi}
            </CardTitle>
            <CardDescription>
              {/* vi: "Top bệnh viện theo doanh thu" / en: "Top hospitals by revenue" */}
              Top bệnh viện theo doanh thu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByHospital.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {/* vi: "Chưa có dữ liệu" / en: "No data yet" */}
                {labels.noRevenue.vi}
              </p>
            ) : (
              <div className="space-y-2">
                {revenueByHospital.map((item, idx) => (
                  <div
                    key={item.organizationId}
                    className="flex items-center justify-between rounded-lg py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm font-medium">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {item.organizationName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {/* vi: "X dịch vụ" / en: "X services" */}
                          {item.serviceCount} dịch vụ
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">
                        {formatVNDCompact(item.totalRevenue)} VND
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {/* vi: "Doanh thu theo nhà cung cấp" / en: "Revenue by Provider" */}
              {labels.revenueByProvider.vi}
            </CardTitle>
            <CardDescription>
              {/* vi: "Top nhà cung cấp theo doanh thu" / en: "Top providers by revenue" */}
              Top nhà cung cấp theo doanh thu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByProvider.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {/* vi: "Chưa có dữ liệu" / en: "No data yet" */}
                {labels.noRevenue.vi}
              </p>
            ) : (
              <div className="space-y-2">
                {revenueByProvider.map((item, idx) => (
                  <div
                    key={item.providerId}
                    className="flex items-center justify-between rounded-lg py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm font-medium">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {item.providerName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {/* vi: "X dịch vụ" / en: "X services" */}
                          {item.serviceCount} dịch vụ
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-purple-600">
                        {formatVNDCompact(item.totalRevenue)} VND
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
