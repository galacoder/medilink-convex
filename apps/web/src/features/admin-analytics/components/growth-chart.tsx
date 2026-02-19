"use client";

/**
 * Growth chart component for the platform admin analytics dashboard.
 *
 * Shows new hospitals and providers per month using Recharts BarChart.
 *
 * WHY: Platform admins need to track platform growth (new hospital/provider
 * onboarding) month-over-month to identify growth trends and sales cycles.
 *
 * Uses Recharts (consistent with M3-4 provider analytics). Do NOT use Chart.js.
 *
 * vi: "Biểu đồ tăng trưởng" / en: "Growth chart"
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

import type { MonthlyGrowthPoint } from "../types";
import { adminAnalyticsLabels } from "../labels";

interface GrowthChartProps {
  hospitalGrowth: MonthlyGrowthPoint[];
  providerGrowth: MonthlyGrowthPoint[];
  isLoading: boolean;
}

interface CombinedGrowthPoint {
  month: string;
  hospitals: number;
  providers: number;
}

/**
 * Merges hospital and provider growth data into a single data array for the chart.
 */
function combineGrowthData(
  hospitalGrowth: MonthlyGrowthPoint[],
  providerGrowth: MonthlyGrowthPoint[],
): CombinedGrowthPoint[] {
  const providerMap = new Map(providerGrowth.map((p) => [p.month, p.count]));
  return hospitalGrowth.map((h) => ({
    month: h.month,
    hospitals: h.count,
    providers: providerMap.get(h.month) ?? 0,
  }));
}

/**
 * Bar chart showing monthly new hospitals and providers onboarded.
 */
export function GrowthChart({
  hospitalGrowth,
  providerGrowth,
  isLoading,
}: GrowthChartProps) {
  const labels = adminAnalyticsLabels.growth;

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

  const chartData = combineGrowthData(hospitalGrowth, providerGrowth);
  const totalHospitals = hospitalGrowth.reduce((sum, h) => sum + h.count, 0);
  const totalProviders = providerGrowth.reduce((sum, p) => sum + p.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {/* vi: "Tăng trưởng" / en: "Growth" */}
          {labels.title.vi}
        </CardTitle>
        <CardDescription>
          {/* vi: "+X bệnh viện, +Y nhà cung cấp" / en: "+X hospitals, +Y providers" */}
          +{totalHospitals} {labels.newHospitals.vi}, +{totalProviders}{" "}
          {labels.newProviders.vi}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.every((d) => d.hospitals === 0 && d.providers === 0) ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            {/* vi: "Chưa có dữ liệu tăng trưởng" / en: "No growth data yet" */}
            Chưa có dữ liệu tăng trưởng
          </p>
        ) : (
          <div className="h-48" data-testid="growth-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
                      value === "hospitals"
                        ? labels.newHospitals.vi /* en: "New Hospitals" */
                        : labels.newProviders.vi /* en: "New Providers" */
                  }
                />
                <Bar dataKey="hospitals" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="providers" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
