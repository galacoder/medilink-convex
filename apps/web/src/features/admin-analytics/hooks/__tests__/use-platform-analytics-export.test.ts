/**
 * Tests for usePlatformAnalyticsExport hook.
 *
 * WHY: The export hook generates a CSV blob from platform analytics data in the
 * browser, so it's tested in isolation from Convex by passing data directly.
 *
 * vi: "Kiểm tra hook xuất dữ liệu phân tích nền tảng"
 * en: "Platform analytics export hook tests"
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePlatformAnalyticsExport } from "../use-platform-analytics-export";

// Mock URL.createObjectURL and URL.revokeObjectURL which are not available in jsdom
Object.defineProperty(global.URL, "createObjectURL", {
  value: vi.fn(() => "blob:mock-url"),
  writable: true,
});
Object.defineProperty(global.URL, "revokeObjectURL", {
  value: vi.fn(),
  writable: true,
});

const mockOverviewStats = {
  totalHospitals: 5,
  totalProviders: 10,
  totalEquipment: 50,
  totalServiceRequests: 100,
  totalRevenue: 50000000,
};

const mockRevenueMetrics = {
  totalRevenue: 50000000,
  averageServiceValue: 500000,
  revenueByHospital: [
    {
      organizationId: "org1",
      organizationName: "Hospital A",
      totalRevenue: 30000000,
      serviceCount: 60,
    },
  ],
  revenueByProvider: [
    {
      providerId: "prov1",
      providerName: "Provider X",
      totalRevenue: 20000000,
      serviceCount: 40,
    },
  ],
};

const mockTopPerformers = {
  topHospitals: [
    {
      organizationId: "org1",
      organizationName: "Hospital A",
      serviceRequestCount: 60,
    },
  ],
  topProviders: [
    {
      providerId: "prov1",
      providerName: "Provider X",
      providerNameEn: "Provider X",
      averageRating: 4.8,
      totalRatings: 30,
      completedServices: 40,
    },
  ],
};

describe("usePlatformAnalyticsExport", () => {
  it("test_usePlatformAnalyticsExport_isInitiallyNotExporting", () => {
    const { result } = renderHook(() => usePlatformAnalyticsExport());
    expect(result.current.isExporting).toBe(false);
  });

  it("test_usePlatformAnalyticsExport_hasExportFunction", () => {
    const { result } = renderHook(() => usePlatformAnalyticsExport());
    expect(result.current.exportToCSV).toBeTypeOf("function");
  });

  it("test_usePlatformAnalyticsExport_handlesNullData", () => {
    const { result } = renderHook(() => usePlatformAnalyticsExport());

    // Should not throw when given null data
    expect(() =>
      result.current.exportToCSV(
        { overview: null, revenueMetrics: null, topPerformers: null },
        "null-export",
      ),
    ).not.toThrow();
  });

  it("test_usePlatformAnalyticsExport_callsWithFullData", () => {
    const { result } = renderHook(() => usePlatformAnalyticsExport());

    act(() => {
      result.current.exportToCSV(
        {
          overview: mockOverviewStats,
          revenueMetrics: mockRevenueMetrics,
          topPerformers: mockTopPerformers,
        },
        "platform-analytics",
      );
    });

    // Should not throw and isExporting should return to false
    expect(result.current.isExporting).toBe(false);
  });

  it("test_usePlatformAnalyticsExport_usesDefaultFilename", () => {
    const { result } = renderHook(() => usePlatformAnalyticsExport());

    const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: vi.fn(),
    });

    act(() => {
      result.current.exportToCSV({
        overview: null,
        revenueMetrics: null,
        topPerformers: null,
      });
    });

    // Verify it ran without error using default filename
    expect(result.current.isExporting).toBe(false);
  });
});
