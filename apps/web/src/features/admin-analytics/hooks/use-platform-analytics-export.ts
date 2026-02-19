"use client";

/**
 * Hook for exporting platform analytics data as CSV.
 *
 * WHY: Platform admins need to export platform-wide metrics for offline analysis,
 * reporting to stakeholders, and compliance records.
 *
 * Export format: Vietnamese labels + English labels (dual-column CSV)
 * per CLAUDE.md: "Export format: Vietnamese labels + English labels (dual-column CSV)"
 *
 * vi: "Hook xuất dữ liệu phân tích nền tảng" / en: "Platform analytics export hook"
 */
import { useState } from "react";

import type {
  PlatformOverviewStats,
  RevenueMetrics,
  TopPerformers,
} from "../types";

export interface PlatformExportData {
  overview: PlatformOverviewStats | null;
  revenueMetrics: RevenueMetrics | null;
  topPerformers: TopPerformers | null;
}

export interface UsePlatformAnalyticsExportResult {
  exportToCSV: (data: PlatformExportData, filename?: string) => void;
  isExporting: boolean;
}

// Bilingual CSV headers for overview section
// vi: "Tiêu đề CSV tổng quan" / en: "Overview CSV headers"
const OVERVIEW_HEADERS = ["Chỉ số / Metric", "Giá trị / Value"];

/**
 * Escapes a CSV field value to handle commas, quotes, and newlines.
 */
function escapeCSVField(value: string | number | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a VND amount for CSV output.
 */
function formatVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} VND`;
}

/**
 * Converts platform analytics data to a comprehensive CSV string with bilingual headers.
 */
function convertPlatformDataToCSV(data: PlatformExportData): string {
  const rows: string[] = [];

  // Section: Overview
  rows.push(OVERVIEW_HEADERS.map(escapeCSVField).join(","));
  rows.push(""); // blank separator

  if (data.overview) {
    const o = data.overview;
    rows.push(
      [
        escapeCSVField("Tổng bệnh viện / Total Hospitals"),
        escapeCSVField(o.totalHospitals),
      ].join(","),
    );
    rows.push(
      [
        escapeCSVField("Tổng nhà cung cấp / Total Providers"),
        escapeCSVField(o.totalProviders),
      ].join(","),
    );
    rows.push(
      [
        escapeCSVField("Tổng thiết bị / Total Equipment"),
        escapeCSVField(o.totalEquipment),
      ].join(","),
    );
    rows.push(
      [
        escapeCSVField("Tổng yêu cầu dịch vụ / Total Service Requests"),
        escapeCSVField(o.totalServiceRequests),
      ].join(","),
    );
    rows.push(
      [
        escapeCSVField("Tổng doanh thu / Total Revenue"),
        escapeCSVField(formatVND(o.totalRevenue)),
      ].join(","),
    );
  }

  rows.push(""); // blank separator

  // Section: Revenue by Hospital
  if (data.revenueMetrics && data.revenueMetrics.revenueByHospital.length > 0) {
    rows.push(escapeCSVField("Doanh thu theo bệnh viện / Revenue by Hospital"));
    rows.push(
      [
        escapeCSVField("Bệnh viện / Hospital"),
        escapeCSVField("Doanh thu / Revenue"),
        escapeCSVField("Số dịch vụ / Service Count"),
      ].join(","),
    );
    for (const item of data.revenueMetrics.revenueByHospital) {
      rows.push(
        [
          escapeCSVField(item.organizationName),
          escapeCSVField(formatVND(item.totalRevenue)),
          escapeCSVField(item.serviceCount),
        ].join(","),
      );
    }
    rows.push(""); // blank separator
  }

  // Section: Revenue by Provider
  if (data.revenueMetrics && data.revenueMetrics.revenueByProvider.length > 0) {
    rows.push(
      escapeCSVField("Doanh thu theo nhà cung cấp / Revenue by Provider"),
    );
    rows.push(
      [
        escapeCSVField("Nhà cung cấp / Provider"),
        escapeCSVField("Doanh thu / Revenue"),
        escapeCSVField("Số dịch vụ / Service Count"),
      ].join(","),
    );
    for (const item of data.revenueMetrics.revenueByProvider) {
      rows.push(
        [
          escapeCSVField(item.providerName),
          escapeCSVField(formatVND(item.totalRevenue)),
          escapeCSVField(item.serviceCount),
        ].join(","),
      );
    }
    rows.push(""); // blank separator
  }

  // Section: Top Performers
  if (data.topPerformers && data.topPerformers.topProviders.length > 0) {
    rows.push(escapeCSVField("Nhà cung cấp hàng đầu / Top Providers"));
    rows.push(
      [
        escapeCSVField("Tên / Name"),
        escapeCSVField("Đánh giá TB / Avg Rating"),
        escapeCSVField("Dịch vụ hoàn thành / Completed Services"),
      ].join(","),
    );
    for (const item of data.topPerformers.topProviders) {
      rows.push(
        [
          escapeCSVField(item.providerName),
          escapeCSVField(item.averageRating.toFixed(1)),
          escapeCSVField(item.completedServices),
        ].join(","),
      );
    }
  }

  return rows.join("\n");
}

/**
 * Returns a hook with an exportToCSV function and isExporting state.
 *
 * Downloads a CSV file directly in the browser without a server roundtrip.
 */
export function usePlatformAnalyticsExport(): UsePlatformAnalyticsExportResult {
  const [isExporting, setIsExporting] = useState(false);

  function exportToCSV(
    data: PlatformExportData,
    filename = "platform-analytics-export",
  ): void {
    setIsExporting(true);

    try {
      const csvContent = convertPlatformDataToCSV(data);
      // Use UTF-8 BOM to ensure Vietnamese characters display correctly in Excel
      const bom = "\uFEFF";
      const blob = new Blob([bom + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return { exportToCSV, isExporting };
}
