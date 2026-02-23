/**
 * Tests for usePayments hook.
 *
 * WHY: Verifies that the hook wraps the Convex payment list query correctly,
 * returns typed results, handles loading state, and filters by status.
 *
 * vi: "Kiem tra hook danh sach thanh toan" / en: "Payments hook tests"
 */
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePayments } from "../use-payments";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API
vi.mock("convex/_generated/api", () => ({
  api: {
    payment: {
      create: "payment:create",
      list: "payment:list",
      getById: "payment:getById",
      updateStatus: "payment:updateStatus",
    },
  },
}));

const mockUseQuery = vi.mocked(useQuery);

function makeMockPayment(
  overrides: Partial<{
    _id: string;
    status: string;
    amount: number;
    descriptionVi: string;
  }> = {},
) {
  const now = Date.now();
  return {
    _id: overrides._id ?? "payment_1",
    _creationTime: now,
    organizationId: "org_1",
    paidBy: "user_1",
    amount: overrides.amount ?? 500000,
    currency: "VND",
    status: overrides.status ?? "pending",
    descriptionVi: overrides.descriptionVi ?? "Thanh toan dich vu",
    createdAt: now,
    updatedAt: now,
  };
}

describe("usePayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test_usePayments_returns_empty_array_when_loading", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => usePayments());

    expect(result.current.payments).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("test_usePayments_returns_payments_when_data_available", () => {
    const mockPayments = [
      makeMockPayment({ _id: "p1" }),
      makeMockPayment({ _id: "p2" }),
    ];
    mockUseQuery.mockReturnValue(mockPayments as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => usePayments());

    expect(result.current.payments).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
  });

  it("test_usePayments_passes_status_filter_to_query", () => {
    mockUseQuery.mockReturnValue([] as ReturnType<typeof useQuery>);

    renderHook(() => usePayments("completed"));

    expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {
      status: "completed",
    });
  });

  it("test_usePayments_passes_empty_object_without_filter", () => {
    mockUseQuery.mockReturnValue([] as ReturnType<typeof useQuery>);

    renderHook(() => usePayments());

    expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {});
  });

  it("test_usePayments_returns_array_not_undefined", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => usePayments());

    expect(Array.isArray(result.current.payments)).toBe(true);
  });
});
