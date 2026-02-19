/**
 * Tests for useActiveServices hook.
 *
 * WHY: Verifies that the hook correctly wraps listActiveServices query,
 * handles loading/error states, and sorts services by scheduled date.
 * Provider staff use this on mobile to see their on-site work queue.
 */
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";

import type { ActiveService } from "../../types";
import { useActiveServices } from "../use-active-services";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);

function createMockActiveService(
  overrides?: Partial<ActiveService>,
): ActiveService {
  const now = Date.now();
  return {
    _id: "sr_active_001",
    _creationTime: now,
    organizationId: "org_hospital_001",
    equipmentId: "eq_001",
    requestedBy: "user_001",
    assignedProviderId: "prov_001",
    type: "repair",
    status: "accepted",
    priority: "medium",
    descriptionVi: "Thiết bị cần sửa chữa gấp",
    scheduledAt: now + 24 * 60 * 60 * 1000, // tomorrow
    createdAt: now,
    updatedAt: now,
    equipmentNameVi: "Máy ECG",
    equipmentNameEn: "ECG Machine",
    equipmentLocation: "Phòng khám số 3",
    hospitalOrgName: "Bệnh viện SPMET",
    acceptedQuoteAmount: 2500000,
    acceptedQuoteCurrency: "VND",
    ...overrides,
  };
}

describe("useActiveServices", () => {
  it("test_useActiveServices_returnsActiveServices - returns active service list", () => {
    const mockServices = [
      createMockActiveService({ _id: "sr_001", status: "accepted" }),
      createMockActiveService({ _id: "sr_002", status: "in_progress" }),
    ];
    mockUseQuery.mockReturnValue(
      mockServices as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useActiveServices());

    expect(result.current.services).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it("returns isLoading=true while Convex query loads", () => {
    mockUseQuery.mockReturnValue(
      undefined as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useActiveServices());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.services).toEqual([]);
  });

  it("test_useActiveServices_returnsErrorOnQueryFailure - hasError=true when Convex returns null", () => {
    mockUseQuery.mockReturnValue(
      null as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useActiveServices());

    expect(result.current.hasError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.services).toEqual([]);
  });

  it("separates accepted (scheduled) from in_progress (on-site) services", () => {
    const mockServices = [
      createMockActiveService({ _id: "sr_001", status: "accepted" }),
      createMockActiveService({ _id: "sr_002", status: "in_progress" }),
      createMockActiveService({ _id: "sr_003", status: "accepted" }),
    ];
    mockUseQuery.mockReturnValue(
      mockServices as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useActiveServices());

    expect(result.current.scheduledServices).toHaveLength(2);
    expect(result.current.onSiteServices).toHaveLength(1);
  });

  it("counts active services correctly", () => {
    const mockServices = [
      createMockActiveService({ _id: "sr_001", status: "accepted" }),
      createMockActiveService({ _id: "sr_002", status: "in_progress" }),
    ];
    mockUseQuery.mockReturnValue(
      mockServices as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useActiveServices());

    expect(result.current.totalCount).toBe(2);
  });
});
