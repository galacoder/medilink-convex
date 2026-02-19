"use client";

/**
 * Service volume chart for the platform admin analytics dashboard.
 *
 * Shows monthly service request counts and completion rate trend using Recharts.
 *
 * WHY: Platform admins need to see if service volume is growing and if the
 * platform's completion rate is improving or declining over time.
 *
 * Uses Recharts (consistent with M3-4 provider analytics). Do NOT use Chart.js.
 *
 * vi: "Biểu đồ khối lượng dịch vụ" / en: "Service volume chart"
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

import type { MonthlyServiceVolume } from "../types";
import { adminAnalyticsLabels } from "../labels";

interface ServiceVolumeChartProps {
  monthlyVolume: MonthlyServiceVolume[];
  overallCompletionRate: number;
  isLoading: boolean;
}

/**
 * Combined service volume and completion rate charts.
 */
export function ServiceVolumeChart({
  monthlyVolume,
  overallCompletionRate,
  isLoading,
}: ServiceVolumeChartProps) {
  const labels = adminAnalyticsLabels.services;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="bg-muted h-5 w-48 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted h-48 animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="bg-muted h-5 w-48 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted h-48 animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionRateData = monthlyVolume.map((item) => ({
    month: item.month,
    completionRate: Math.round(item.completionRate * 100),
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Monthly volume bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {/* vi: "Yêu cầu dịch vụ theo tháng" / en: "Service Requests per Month" */}
            {labels.monthlyVolume.vi}
          </CardTitle>
          <CardDescription>
            {/* vi: "Tỷ lệ hoàn thành tổng thể: X%" / en: "Overall completion rate: X%" */}
            {labels.overallCompletionRate.vi}:{" "}
            {Math.round(overallCompletionRate * 100)}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyVolume.every((d) => d.total === 0) ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              {/* vi: "Chưa có dữ liệu dịch vụ" / en: "No service data yet" */}
              Chưa có dữ liệu dịch vụ
            </p>
          ) : (
            <div className="h-48" data-testid="service-volume-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyVolume}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip />
                  <Legend
                    formatter={
                      (value: string) =>
                        value === "completed"
                          ? labels.completed.vi /* en: "Completed" */
                          : value === "cancelled"
                            ? labels.cancelled.vi /* en: "Cancelled" */
                            : labels.totalRequests.vi /* en: "Total" */
                    }
                  />
                  <Bar
                    dataKey="completed"
                    fill="#22c55e"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="cancelled"
                    fill="#ef4444"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion rate trend line chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {/* vi: "Tỷ lệ hoàn thành theo tháng" / en: "Completion Rate Trend" */}
            {labels.completionRate.vi}
          </CardTitle>
          <CardDescription>
            {/* vi: "Phần trăm yêu cầu hoàn thành" / en: "% of requests completed" */}
            Phần trăm yêu cầu hoàn thành
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completionRateData.every((d) => d.completionRate === 0) ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              {/* vi: "Chưa có dữ liệu" / en: "No data yet" */}
              Chưa có dữ liệu
            </p>
          ) : (
            <div className="h-48" data-testid="completion-rate-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={completionRateData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    stroke="#22c55e"
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
    </div>
  );
}
