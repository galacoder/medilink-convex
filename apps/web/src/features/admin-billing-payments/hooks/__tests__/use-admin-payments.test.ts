/**
 * Tests for useAdminPayments hook.
 *
 * WHY: Verifies that the hook wraps the Convex billing.payments.listPayments
 * query correctly, returns typed results, handles loading state, and passes filters.
 *
 * vi: "Kiem tra hook danh sach thanh toan quan tri" / en: "Admin payments hook tests"
 */
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAdminPayments } from "../use-admin-payments";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API
vi.mock("@medilink/backend", () => ({
  api: {
    billing: {
      payments: {
        listPayments: "billing/payments:listPayments",
        getPaymentDetail: "billing/payments:getPaymentDetail",
        recordPayment: "billing/payments:recordPayment",
        confirmPayment: "billing/payments:confirmPayment",
        rejectPayment: "billing/payments:rejectPayment",
        voidPayment: "billing/payments:voidPayment",
        getPaymentsByOrganization: "billing/payments:getPaymentsByOrganization",
      },
    },
  },
}));

const mockUseQuery = vi.mocked(useQuery);

function makeMockPaymentListResult(count = 2) {
  const payments = Array.from({ length: count }, (_, i) => ({
    _id: `payment_${i + 1}`,
    _creationTime: Date.now(),
    organizationId: `org_${i + 1}`,
    organizationName: `Hospital ${i + 1}`,
    amountVnd: (i + 1) * 1000000,
    paymentMethod: "bank_transfer" as const,
    paymentType: "subscription_new" as const,
    status: "pending" as const,
    invoiceNumber: `ML-20260225-000${i + 1}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
  return { payments, total: count };
}

describe("useAdminPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array and isLoading=true when query is loading", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useAdminPayments());

    expect(result.current.payments).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.isLoading).toBe(true);
  });

  it("should return payments when data is available", () => {
    const mockResult = makeMockPaymentListResult(3);
    mockUseQuery.mockReturnValue(mockResult as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useAdminPayments());

    expect(result.current.payments).toHaveLength(3);
    expect(result.current.total).toBe(3);
    expect(result.current.isLoading).toBe(false);
  });

  it("should pass status filter to query", () => {
    mockUseQuery.mockReturnValue(
      makeMockPaymentListResult(0) as ReturnType<typeof useQuery>,
    );

    renderHook(() => useAdminPayments({ statusFilter: "confirmed" }));

    expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {
      statusFilter: "confirmed",
      organizationId: undefined,
      searchQuery: undefined,
    });
  });

  it("should pass search query to query", () => {
    mockUseQuery.mockReturnValue(
      makeMockPaymentListResult(0) as ReturnType<typeof useQuery>,
    );

    renderHook(() => useAdminPayments({ searchQuery: "SPMET" }));

    expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {
      statusFilter: undefined,
      organizationId: undefined,
      searchQuery: "SPMET",
    });
  });

  it("should pass all filters to query", () => {
    mockUseQuery.mockReturnValue(
      makeMockPaymentListResult(0) as ReturnType<typeof useQuery>,
    );

    renderHook(() =>
      useAdminPayments({
        statusFilter: "pending",
        organizationId: "org_123",
        searchQuery: "invoice",
      }),
    );

    expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {
      statusFilter: "pending",
      organizationId: "org_123",
      searchQuery: "invoice",
    });
  });

  it("should return array (not undefined) when loading", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useAdminPayments());

    expect(Array.isArray(result.current.payments)).toBe(true);
  });
});
