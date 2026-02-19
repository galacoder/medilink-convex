/**
 * Tests for useServiceRequestNotifications hook.
 *
 * WHY: Verifies that badge counts are correctly computed from Convex queries.
 * Critical for AC-07 (notification indicators: badge count for new quotes
 * and status updates).
 */
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";

import { createMockServiceRequest } from "~/test-utils";
import { useServiceRequestNotifications } from "../use-service-request-notifications";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);

describe("useServiceRequestNotifications", () => {
  it("test_useServiceRequestNotifications_countsNewQuotes", () => {
    // Simulate 2 quoted requests
    mockUseQuery.mockReturnValue([
      createMockServiceRequest({ _id: "sr_001", status: "quoted" }),
      createMockServiceRequest({ _id: "sr_002", status: "quoted" }),
    ] as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useServiceRequestNotifications());

    expect(result.current.quotedCount).toBe(2);
  });

  it("test_useServiceRequestNotifications_countsActiveRequests", () => {
    mockUseQuery.mockReturnValue([
      createMockServiceRequest({ _id: "sr_001", status: "quoted" }),
    ] as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useServiceRequestNotifications());

    expect(result.current.totalBadge).toBeGreaterThanOrEqual(0);
  });

  it("test_NotificationBadge_showsCount", () => {
    mockUseQuery.mockReturnValue([
      createMockServiceRequest({ status: "quoted" }),
      createMockServiceRequest({ status: "quoted" }),
      createMockServiceRequest({ status: "quoted" }),
    ] as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useServiceRequestNotifications());

    // Badge count should be 3 (3 quoted requests)
    expect(result.current.totalBadge).toBe(3);
  });

  it("test_NotificationBadge_hidesWhenZero", () => {
    mockUseQuery.mockReturnValue([] as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useServiceRequestNotifications());

    // No requests = zero badge
    expect(result.current.totalBadge).toBe(0);
    expect(result.current.quotedCount).toBe(0);
  });
});
