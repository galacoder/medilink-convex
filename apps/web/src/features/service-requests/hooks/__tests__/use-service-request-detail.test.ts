/**
 * Tests for useServiceRequestDetail hook.
 *
 * WHY: Verifies that the hook correctly maps Convex's return values
 * (undefined = loading, null = not found, object = data) to meaningful
 * boolean flags and typed data for components.
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { createMockServiceRequest } from "~/test-utils";
import { useServiceRequestDetail } from "../use-service-request-detail";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

import { useQuery } from "convex/react";

const mockUseQuery = vi.mocked(useQuery);

describe("useServiceRequestDetail", () => {
  it("test_useServiceRequestDetail_returnsFullDetail", () => {
    const mockDetail = {
      ...createMockServiceRequest({ _id: "sr_001" }),
      equipment: {
        nameVi: "Máy đo huyết áp",
        nameEn: "Blood Pressure Monitor",
        status: "available",
        condition: "good",
      },
      quotes: [],
      rating: null,
      hospitalOrgName: "Bệnh viện SPMET",
    };
    mockUseQuery.mockReturnValue(mockDetail as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useServiceRequestDetail("sr_001"));

    expect(result.current.detail).toEqual(mockDetail);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.notFound).toBe(false);
  });

  it("test_useServiceRequestDetail_includesQuotes", () => {
    const mockDetail = {
      ...createMockServiceRequest({ _id: "sr_001", status: "quoted" }),
      equipment: null,
      quotes: [
        {
          _id: "q_001",
          _creationTime: Date.now(),
          serviceRequestId: "sr_001",
          providerId: "prov_001",
          status: "pending",
          amount: 500000,
          currency: "VND",
          validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          providerNameVi: "Công ty ABC",
          providerNameEn: "ABC Company",
          providerOrgName: "ABC",
        },
      ],
      rating: null,
      hospitalOrgName: null,
    };
    mockUseQuery.mockReturnValue(mockDetail as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useServiceRequestDetail("sr_001"));

    expect(result.current.detail?.quotes).toHaveLength(1);
    expect(result.current.detail?.quotes[0]?.amount).toBe(500000);
  });

  it("test_useServiceRequestDetail_handlesNotFound", () => {
    mockUseQuery.mockReturnValue(null as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useServiceRequestDetail("nonexistent"));

    expect(result.current.detail).toBeNull();
    expect(result.current.notFound).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("test_useServiceRequestDetail_handlesLoadingState", () => {
    mockUseQuery.mockReturnValue(undefined as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useServiceRequestDetail("sr_001"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.notFound).toBe(false);
  });

  it("test_useServiceRequestDetail_skipsWhenNoId", () => {
    mockUseQuery.mockReturnValue(undefined as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useServiceRequestDetail(null));

    // When id is null, isLoading should be false (query is skipped)
    expect(result.current.isLoading).toBe(false);
    expect(mockUseQuery).toHaveBeenCalledWith(
      "serviceRequests:getById",
      "skip",
    );
  });
});
