/**
 * Tests for useServiceRequests hook.
 *
 * WHY: Hooks are tested by mocking the Convex useQuery to return controlled
 * data, isolating the hook's filtering logic and return shape from the
 * actual Convex runtime.
 */
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";

import { createMockServiceRequest } from "~/test-utils";
import { useServiceRequests } from "../use-service-requests";

// Mock convex/react so tests don't need a live Convex deployment.
// The convex/_generated/api is mocked via vitest.config.ts alias -> src/__mocks__/convex-api.ts
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);

describe("useServiceRequests", () => {
  it("test_useServiceRequests_returnsListForOrg", () => {
    const mockRequests = [
      createMockServiceRequest({ _id: "sr_001", status: "pending" }),
      createMockServiceRequest({ _id: "sr_002", status: "quoted" }),
    ];
    mockUseQuery.mockReturnValue(
      mockRequests as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useServiceRequests());

    expect(result.current.requests).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
  });

  it("test_useServiceRequests_filtersByStatus", () => {
    const pendingRequests = [
      createMockServiceRequest({ _id: "sr_001", status: "pending" }),
    ];
    mockUseQuery.mockReturnValue(
      pendingRequests as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useServiceRequests("pending"));

    // Verify useQuery is called (filtering is server-side via Convex args)
    expect(mockUseQuery).toHaveBeenCalledWith(
      "serviceRequests:listByHospital",
      { status: "pending" },
    );
    expect(result.current.requests).toHaveLength(1);
  });

  it("test_useServiceRequests_handlesLoadingState", () => {
    // Convex returns undefined while loading
    mockUseQuery.mockReturnValue(
      undefined as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useServiceRequests());

    expect(result.current.requests).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("test_useServiceRequests_allStatusPassesNoFilter", () => {
    mockUseQuery.mockReturnValue([] as unknown as ReturnType<typeof useQuery>);

    renderHook(() => useServiceRequests("all"));

    // "all" should result in no status filter passed to Convex
    expect(mockUseQuery).toHaveBeenCalledWith(
      "serviceRequests:listByHospital",
      {},
    );
  });
});
