"use client";

/**
 * Top performers table for the platform admin analytics dashboard.
 *
 * Shows top 5 hospitals by activity and top 5 providers by rating.
 *
 * WHY: Platform admins need to identify the most active hospitals (to upsell
 * premium support) and highest-rated providers (to feature/promote them).
 *
 * vi: "Bảng đơn vị hàng đầu" / en: "Top performers table"
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { TopHospitalEntry, TopProviderEntry } from "../types";
import { adminAnalyticsLabels } from "../labels";

interface TopPerformersTableProps {
  topHospitals: TopHospitalEntry[];
  topProviders: TopProviderEntry[];
  isLoading: boolean;
}

/**
 * Renders star rating as text (e.g. "4.5 ★")
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-yellow-500">★</span>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </span>
  );
}

/**
 * Top performers with top hospitals and top providers side by side.
 */
export function TopPerformersTable({
  topHospitals,
  topProviders,
  isLoading,
}: TopPerformersTableProps) {
  const labels = adminAnalyticsLabels.topPerformers;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="bg-muted h-5 w-40 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
            <div className="space-y-3">
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
    <div className="grid gap-4 md:grid-cols-2">
      {/* Top hospitals by activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {/* vi: "Top 5 bệnh viện (theo hoạt động)" / en: "Top 5 Hospitals by Activity" */}
            {labels.topHospitals.vi}
          </CardTitle>
          <CardDescription>
            {/* vi: "Xếp theo số yêu cầu dịch vụ" / en: "Ranked by service request count" */}
            Xếp theo số yêu cầu dịch vụ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topHospitals.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {/* vi: "Chưa có dữ liệu" / en: "No data yet" */}
              {labels.noData.vi}
            </p>
          ) : (
            <div className="space-y-3">
              {topHospitals.map((hospital, idx) => (
                <div
                  key={hospital.organizationId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {hospital.organizationName}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {/* vi: "X yêu cầu" / en: "X requests" */}
                    {hospital.serviceRequestCount} {labels.serviceRequests.vi}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top providers by rating */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {/* vi: "Top 5 nhà cung cấp (theo đánh giá)" / en: "Top 5 Providers by Rating" */}
            {labels.topProviders.vi}
          </CardTitle>
          <CardDescription>
            {/* vi: "Xếp theo đánh giá trung bình" / en: "Ranked by average rating" */}
            Xếp theo đánh giá trung bình
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topProviders.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {/* vi: "Chưa có nhà cung cấp đã đánh giá" / en: "No rated providers yet" */}
              {labels.noData.vi}
            </p>
          ) : (
            <div className="space-y-3">
              {topProviders.map((provider, idx) => (
                <div
                  key={provider.providerId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-sm font-semibold text-purple-600">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {provider.providerName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {/* vi: "X dịch vụ hoàn thành" / en: "X completed services" */}
                        {provider.completedServices}{" "}
                        {labels.completedServices.vi}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={provider.averageRating} />
                    <span className="text-muted-foreground text-xs">
                      ({provider.totalRatings})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
