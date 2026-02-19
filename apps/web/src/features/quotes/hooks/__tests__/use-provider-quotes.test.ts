/**
 * Tests for useProviderQuotes hook.
 *
 * WHY: Verifies that the hook correctly wraps listByProvider query,
 * handles status filtering, and calculates dashboard stats (win rate etc.)
 * from the returned quote list.
 */
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";

import type { ProviderQuote } from "../../types";
import { useProviderQuotes } from "../use-provider-quotes";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);

function createMockProviderQuote(
  overrides?: Partial<ProviderQuote>,
): ProviderQuote {
  const now = Date.now();
  return {
    _id: "q_test_001",
    _creationTime: now,
    serviceRequestId: "sr_test_001",
    providerId: "prov_test_001",
    status: "pending",
    amount: 500000,
    currency: "VND",
    validUntil: now + 7 * 24 * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
    serviceRequest: {
      _id: "sr_test_001",
      status: "quoted",
      type: "repair",
      priority: "medium",
      descriptionVi: "Thiết bị bị hỏng",
      equipmentNameVi: "Máy đo huyết áp",
      equipmentNameEn: "Blood Pressure Monitor",
      hospitalOrgName: "Bệnh viện Đại học Y Dược",
    },
    ...overrides,
  };
}

describe("useProviderQuotes", () => {
  it("test_useProviderQuotes_returnsQuotesWithSR - returns quotes with service request summary", () => {
    const mockQuotes = [
      createMockProviderQuote({ _id: "q_001" }),
      createMockProviderQuote({ _id: "q_002", status: "accepted" }),
    ];
    mockUseQuery.mockReturnValue(
      mockQuotes as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useProviderQuotes());

    expect(result.current.quotes).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.quotes[0]?.serviceRequest).not.toBeNull();
  });

  it("calculates stats correctly - pending, accepted, rejected counts", () => {
    const mockQuotes = [
      createMockProviderQuote({ _id: "q_001", status: "pending" }),
      createMockProviderQuote({ _id: "q_002", status: "accepted" }),
      createMockProviderQuote({ _id: "q_003", status: "accepted" }),
      createMockProviderQuote({ _id: "q_004", status: "rejected" }),
    ];
    mockUseQuery.mockReturnValue(
      mockQuotes as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useProviderQuotes());

    expect(result.current.stats.pendingCount).toBe(1);
    expect(result.current.stats.acceptedCount).toBe(2);
    expect(result.current.stats.rejectedCount).toBe(1);
    expect(result.current.stats.totalCount).toBe(4);
  });

  it("calculates win rate as accepted / (accepted + rejected) * 100", () => {
    const mockQuotes = [
      createMockProviderQuote({ _id: "q_001", status: "accepted" }),
      createMockProviderQuote({ _id: "q_002", status: "accepted" }),
      createMockProviderQuote({ _id: "q_003", status: "rejected" }),
    ];
    mockUseQuery.mockReturnValue(
      mockQuotes as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useProviderQuotes());

    // 2 accepted / 3 decided = 66.67% -> rounded to 67
    expect(result.current.stats.winRate).toBe(67);
  });

  it("returns winRate=-1 when no decided quotes yet", () => {
    const mockQuotes = [
      createMockProviderQuote({ _id: "q_001", status: "pending" }),
    ];
    mockUseQuery.mockReturnValue(
      mockQuotes as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useProviderQuotes());

    expect(result.current.stats.winRate).toBe(-1);
  });

  it("returns isLoading=true while Convex query loads", () => {
    mockUseQuery.mockReturnValue(
      undefined as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useProviderQuotes());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.quotes).toEqual([]);
  });

  it("test_useProviderQuotes_returnsErrorOnQueryFailure - hasError=true when Convex returns null", () => {
    // Convex returns null when the query handler throws a ConvexError
    mockUseQuery.mockReturnValue(
      null as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useProviderQuotes());

    expect(result.current.hasError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.quotes).toEqual([]);
  });

  it("hasError=false and isLoading=false on successful response", () => {
    const mockQuotes = [createMockProviderQuote({ _id: "q_001" })];
    mockUseQuery.mockReturnValue(
      mockQuotes as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useProviderQuotes());

    expect(result.current.hasError).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.quotes).toHaveLength(1);
  });
});
