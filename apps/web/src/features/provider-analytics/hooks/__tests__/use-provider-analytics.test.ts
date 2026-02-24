/**
 * Tests for useProviderAnalytics hook.
 *
 * WHY: Hooks are tested by mocking the Convex useQuery to return controlled
 * data, isolating the hook's aggregation logic and return shape from the
 * actual Convex runtime.
 *
 * vi: "Kiểm tra hook phân tích nhà cung cấp" / en: "Provider analytics hook tests"
 */
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";

import { useProviderAnalytics } from "../use-provider-analytics";

// Mock convex/react so tests don't need a live Convex deployment.
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

// Mock the convex generated API — analytics is a new module, not yet in the
// generated _generated/api. Using a stub ensures the import works in tests
// without a running Convex instance.
vi.mock("@medilink/backend", () => ({
  api: {
    analytics: {
      getProviderSummary: "analytics:getProviderSummary",
    },
  },
}));

const mockUseQuery = vi.mocked(useQuery);

const mockSummary = {
  totalRevenue: 5000000,
  completedServices: 10,
  completionRate: 0.85,
  thisMonthServices: 3,
  lastMonthServices: 4,
  totalQuotesSubmitted: 15,
  quoteWinRate: 0.67,
  avgQuoteResponseTimeDays: 1.5,
  averageRating: 4.5,
  totalRatings: 10,
};

describe("useProviderAnalytics", () => {
  it("test_useProviderAnalytics_returnsDataWhenLoaded", () => {
    mockUseQuery.mockReturnValue(mockSummary as unknown);

    const { result } = renderHook(() =>
      useProviderAnalytics({
        providerId: "prov_001",
        dateRange: "30d",
      }),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.summary).toEqual(mockSummary);
  });

  it("test_useProviderAnalytics_handlesLoadingState", () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useProviderAnalytics({
        providerId: "prov_001",
        dateRange: "30d",
      }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.summary).toBeNull();
  });

  it("test_useProviderAnalytics_skipsQueryWhenNoProviderId", () => {
    mockUseQuery.mockReturnValue(undefined);

    renderHook(() =>
      useProviderAnalytics({
        providerId: "",
        dateRange: "30d",
      }),
    );

    // Should have been called with "skip" when providerId is empty
    expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), "skip");
  });

  it("test_useProviderAnalytics_supportsAllDateRanges", () => {
    mockUseQuery.mockReturnValue(mockSummary as unknown);

    for (const dateRange of ["7d", "30d", "90d"] as const) {
      const { result } = renderHook(() =>
        useProviderAnalytics({ providerId: "prov_001", dateRange }),
      );
      expect(result.current.summary).toBeDefined();
    }
  });
});
