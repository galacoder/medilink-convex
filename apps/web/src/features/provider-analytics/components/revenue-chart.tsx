"use client";

/**
 * Revenue trend chart component — line chart for monthly revenue.
 *
 * WHY: Providers need to understand revenue trends over time to make
 * data-driven decisions about service capacity and pricing. A line chart
 * makes month-over-month growth or decline immediately visible.
 *
 * Uses Recharts (consistent with M4-4 platform analytics). Do NOT use Chart.js.
 *
 * vi: "Biểu đồ doanh thu" / en: "Revenue chart"
 */
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { MonthlyRevenue } from "../types";
import { analyticsLabels } from "../labels";

interface RevenueChartProps {
  data: MonthlyRevenue[];
  isLoading: boolean;
}

/**
 * Formats VND amount to a compact string for chart axis labels.
 * e.g. 1000000 → "1Tr" (1 triệu)
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
 * Custom tooltip for the revenue line chart.
 */
function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const revenue = payload[0]?.value ?? 0;
  return (
    <div className="bg-background rounded-md border p-3 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-blue-600">
        {/* vi: "Doanh thu" / en: "Revenue" */}
        Doanh thu: {revenue.toLocaleString("vi-VN")} VND
      </p>
    </div>
  );
}

/**
 * Line chart showing monthly revenue trend over the past N months.
 */
export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const labels = analyticsLabels.revenue;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="bg-muted h-5 w-40 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-48 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {/* vi: "Doanh thu theo tháng" / en: "Revenue by Month" */}
          {labels.revenueByMonth.vi}
        </CardTitle>
        <CardDescription>
          {/* vi: "Tổng: X VND" / en: "Total: X VND" */}
          Tổng: {totalRevenue.toLocaleString("vi-VN")} VND
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 || totalRevenue === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            {/* vi: "Chưa có doanh thu" / en: "No revenue yet" */}
            {labels.noRevenue.vi}
          </p>
        ) : (
          <div className="h-48" data-testid="revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickFormatter={formatVNDCompact}
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <Tooltip content={<RevenueTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
