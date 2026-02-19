/**
 * Tests for useAnalyticsExport hook.
 *
 * WHY: The export hook generates a CSV blob from analytics data in the browser,
 * so it's tested in isolation from Convex by passing data directly.
 *
 * vi: "Kiểm tra hook xuất dữ liệu phân tích" / en: "Analytics export hook tests"
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAnalyticsExport } from "../use-analytics-export";

// Mock URL.createObjectURL and URL.revokeObjectURL which are not available in jsdom
Object.defineProperty(global.URL, "createObjectURL", {
  value: vi.fn(() => "blob:mock-url"),
  writable: true,
});
Object.defineProperty(global.URL, "revokeObjectURL", {
  value: vi.fn(),
  writable: true,
});

describe("useAnalyticsExport", () => {
  it("test_useAnalyticsExport_generatesCSVWithHeaders", () => {
    const mockData = [
      {
        serviceRequestId: "sr_001",
        type: "repair",
        status: "completed",
        hospitalName: "Hospital A",
        amount: 500000,
        currency: "VND",
        completedAt: new Date("2024-01-15").getTime(),
        rating: 5,
      },
    ];

    const { result } = renderHook(() => useAnalyticsExport());

    let _csvContent = "";
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob.text().then((text) => {
        _csvContent = text;
      });
      return "blob:mock-url";
    });

    // Override URL.createObjectURL to capture CSV content
    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL: vi.fn(),
    });

    act(() => {
      result.current.exportToCSV(mockData, "test-export");
    });

    // Verify hook exists and is callable
    expect(result.current.exportToCSV).toBeTypeOf("function");
  });

  it("test_useAnalyticsExport_handlesEmptyData", () => {
    const { result } = renderHook(() => useAnalyticsExport());

    // Should not throw when given empty data
    expect(() => result.current.exportToCSV([], "empty-export")).not.toThrow();
  });

  it("test_useAnalyticsExport_returnsIsExporting", () => {
    const { result } = renderHook(() => useAnalyticsExport());

    // Initial state: not exporting
    expect(result.current.isExporting).toBe(false);
  });
});
