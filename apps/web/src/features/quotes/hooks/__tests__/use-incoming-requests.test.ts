/**
 * Tests for useIncomingRequests hook.
 *
 * WHY: Hooks are tested by mocking the Convex useQuery to return controlled
 * data, isolating the hook's filtering logic and return shape from the
 * actual Convex runtime.
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useIncomingRequests } from "../use-incoming-requests";
import type { IncomingServiceRequest } from "../../types";

// Mock convex/react so tests don't need a live Convex deployment.
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

import { useQuery } from "convex/react";

const mockUseQuery = vi.mocked(useQuery);

function createMockIncomingRequest(
  overrides?: Partial<IncomingServiceRequest>,
): IncomingServiceRequest {
  const now = Date.now();
  return {
    _id: "sr_test_001",
    _creationTime: now,
    organizationId: "org_hospital_001",
    equipmentId: "eq_test_001",
    requestedBy: "user_test_001",
    type: "repair",
    status: "pending",
    priority: "medium",
    descriptionVi: "Thiết bị bị hỏng cần sửa chữa gấp",
    createdAt: now,
    updatedAt: now,
    hospitalOrgName: "Bệnh viện Đại học Y Dược",
    equipmentNameVi: "Máy đo huyết áp",
    equipmentNameEn: "Blood Pressure Monitor",
    ...overrides,
  };
}

describe("useIncomingRequests", () => {
  it("test_useIncomingRequests_returnsTypedList - returns typed list of incoming requests", () => {
    const mockRequests = [
      createMockIncomingRequest({ _id: "sr_001", status: "pending" }),
      createMockIncomingRequest({ _id: "sr_002", status: "quoted" }),
    ];
    mockUseQuery.mockReturnValue(
      mockRequests as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useIncomingRequests());

    expect(result.current.requests).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
  });

  it("test_useIncomingRequests_handlesStatusFilter - passes status filter to Convex", () => {
    const pendingRequests = [
      createMockIncomingRequest({ _id: "sr_001", status: "pending" }),
    ];
    mockUseQuery.mockReturnValue(
      pendingRequests as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useIncomingRequests("pending"));

    expect(mockUseQuery).toHaveBeenCalledWith(
      "serviceRequests:listByProvider",
      { status: "pending" },
    );
    expect(result.current.requests).toHaveLength(1);
  });

  it("returns empty array and isLoading=true while Convex query loads", () => {
    mockUseQuery.mockReturnValue(
      undefined as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useIncomingRequests());

    expect(result.current.requests).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("passes no status filter when 'all' is specified", () => {
    mockUseQuery.mockReturnValue([] as unknown as ReturnType<typeof useQuery>);

    renderHook(() => useIncomingRequests("all"));

    expect(mockUseQuery).toHaveBeenCalledWith(
      "serviceRequests:listByProvider",
      {},
    );
  });

  it("returns empty array when query returns empty list", () => {
    mockUseQuery.mockReturnValue([] as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useIncomingRequests());

    expect(result.current.requests).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
