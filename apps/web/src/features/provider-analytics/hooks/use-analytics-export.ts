"use client";

/**
 * Hook for exporting provider analytics data as CSV.
 *
 * WHY: Providers need to export service history with financial data for
 * compliance reporting and business analysis. This hook generates a CSV
 * blob in the browser using the data fetched from Convex.
 *
 * Export format: Vietnamese labels + English labels (dual-column CSV)
 * per CLAUDE.md: "Export format: Vietnamese labels + English labels (dual-column CSV)"
 *
 * vi: "Hook xuất dữ liệu phân tích" / en: "Analytics export hook"
 */
import { useState } from "react";

export interface ExportableServiceRecord {
  serviceRequestId: string;
  type: string;
  status: string;
  hospitalName: string;
  amount: number;
  currency: string;
  completedAt?: number;
  rating?: number;
}

export interface UseAnalyticsExportResult {
  exportToCSV: (data: ExportableServiceRecord[], filename?: string) => void;
  isExporting: boolean;
}

// Bilingual CSV headers
// vi: "Tiêu đề CSV" / en: "CSV headers"
const CSV_HEADERS = [
  "ID Yêu cầu / Request ID",
  "Loại dịch vụ / Service Type",
  "Trạng thái / Status",
  "Bệnh viện / Hospital",
  "Doanh thu (VND) / Revenue (VND)",
  "Tiền tệ / Currency",
  "Ngày hoàn thành / Completed Date",
  "Đánh giá / Rating",
];

/**
 * Formats a number epoch timestamp to a readable date string.
 * Uses Vietnamese date format (DD/MM/YYYY).
 */
function formatDate(timestamp?: number): string {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("vi-VN");
}

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
 * Converts service records to a CSV string with bilingual headers.
 */
function convertToCSV(data: ExportableServiceRecord[]): string {
  const headerRow = CSV_HEADERS.map(escapeCSVField).join(",");

  const dataRows = data.map((record) =>
    [
      escapeCSVField(record.serviceRequestId),
      escapeCSVField(record.type),
      escapeCSVField(record.status),
      escapeCSVField(record.hospitalName),
      escapeCSVField(record.amount),
      escapeCSVField(record.currency),
      escapeCSVField(formatDate(record.completedAt)),
      escapeCSVField(record.rating),
    ].join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Returns a hook with an exportToCSV function and isExporting state.
 *
 * The CSV file is downloaded directly by creating a temporary anchor element
 * and triggering a click — no server roundtrip required.
 */
export function useAnalyticsExport(): UseAnalyticsExportResult {
  const [isExporting, setIsExporting] = useState(false);

  function exportToCSV(
    data: ExportableServiceRecord[],
    filename = "provider-analytics-export",
  ): void {
    setIsExporting(true);

    try {
      const csvContent = convertToCSV(data);
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
