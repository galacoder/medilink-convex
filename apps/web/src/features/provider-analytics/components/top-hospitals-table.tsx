"use client";

/**
 * Top hospitals table component — shows hospital relationships sorted by revenue.
 *
 * WHY: Providers benefit from seeing which hospitals bring the most revenue
 * and which are repeat clients, enabling targeted relationship management.
 *
 * vi: "Bảng bệnh viện hàng đầu" / en: "Top hospitals table"
 */
import { BadgeCheckIcon } from "lucide-react";

import { Badge } from "@medilink/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { HospitalRelationship } from "../types";
import { analyticsLabels } from "../labels";

interface TopHospitalsTableProps {
  hospitals: HospitalRelationship[];
  isLoading: boolean;
}

/**
 * Formats a VND amount to a readable string.
 * vi: "Định dạng số tiền VND" / en: "Format VND amount"
 */
function formatVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} VND`;
}

/**
 * Displays the top hospitals by revenue as a ranked table.
 */
export function TopHospitalsTable({
  hospitals,
  isLoading,
}: TopHospitalsTableProps) {
  const labels = analyticsLabels.hospitals;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="bg-muted h-5 w-40 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-10 animate-pulse rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {/* vi: "Bệnh viện hàng đầu" / en: "Top Hospitals" */}
          {labels.title.vi}
        </CardTitle>
        <CardDescription>
          {/* vi: "Theo doanh thu" / en: "By revenue" */}
          Theo doanh thu
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hospitals.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {/* vi: "Chưa có bệnh viện" / en: "No hospital relationships yet" */}
            {labels.noHospitals.vi}
          </p>
        ) : (
          <div className="space-y-3" data-testid="top-hospitals-table">
            {/* Table header */}
            <div className="text-muted-foreground grid grid-cols-3 border-b pb-2 text-xs font-medium">
              <span>{labels.hospitalName.vi}</span>
              <span className="text-right">{labels.completedServices.vi}</span>
              <span className="text-right">{labels.totalRevenue.vi}</span>
            </div>
            {/* Table rows */}
            {hospitals.map((hospital, idx) => (
              <div
                key={hospital.hospitalName}
                className="grid grid-cols-3 items-center text-sm"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground w-4 text-xs">
                    {idx + 1}.
                  </span>
                  <div>
                    <div className="font-medium">{hospital.hospitalName}</div>
                    {hospital.isRepeat && (
                      <Badge
                        variant="secondary"
                        className="mt-0.5 h-4 text-[10px]"
                      >
                        <BadgeCheckIcon className="mr-0.5 h-2.5 w-2.5" />
                        {/* vi: "Khách hàng thân thiết" / en: "Repeat Client" */}
                        {labels.repeatClient.vi}
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="text-right">{hospital.completedServices}</span>
                <span className="text-right text-xs font-medium">
                  {formatVND(hospital.totalRevenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
