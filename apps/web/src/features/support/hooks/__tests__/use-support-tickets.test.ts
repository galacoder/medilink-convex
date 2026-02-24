/**
 * Tests for useSupportTickets hook.
 *
 * WHY: Verifies that the hook wraps the Convex listByOrg query correctly,
 * returns typed results, handles loading state, and filters by status.
 *
 * vi: "Kiem tra hook danh sach phieu ho tro" / en: "Support tickets hook tests"
 */
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMyTickets, useSupportTickets } from "../use-support-tickets";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API
vi.mock("@medilink/backend", () => ({
  api: {
    support: {
      listByOrg: "support:listByOrg",
      listByUser: "support:listByUser",
      getById: "support:getById",
      addMessage: "support:addMessage",
      updateStatus: "support:updateStatus",
      create: "support:create",
    },
  },
}));

const mockUseQuery = vi.mocked(useQuery);

function makeMockTicket(
  overrides: Partial<{
    _id: string;
    status: string;
    priority: string;
    category: string;
    subjectVi: string;
  }> = {},
) {
  const now = Date.now();
  return {
    _id: overrides._id ?? "ticket_1",
    _creationTime: now,
    organizationId: "org_1",
    createdBy: "user_1",
    status: overrides.status ?? "open",
    priority: overrides.priority ?? "medium",
    category: overrides.category ?? "general",
    subjectVi: overrides.subjectVi ?? "Van de ky thuat",
    subjectEn: "Technical issue",
    descriptionVi: "Mo ta chi tiet",
    createdAt: now,
    updatedAt: now,
  };
}

describe("useSupportTickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test_useSupportTickets_returns_empty_array_when_loading", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useSupportTickets());

    expect(result.current.tickets).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("test_useSupportTickets_returns_tickets_when_data_available", () => {
    const mockTickets = [
      makeMockTicket({ _id: "t1", status: "open" }),
      makeMockTicket({ _id: "t2", status: "in_progress" }),
    ];
    mockUseQuery.mockReturnValue(mockTickets as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useSupportTickets());

    expect(result.current.tickets).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.tickets[0]?._id).toBe("t1");
  });

  it("test_useSupportTickets_passes_status_filter_to_query", () => {
    mockUseQuery.mockReturnValue([] as ReturnType<typeof useQuery>);

    renderHook(() => useSupportTickets("open"));

    // Verify useQuery was called with the status filter
    expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {
      status: "open",
    });
  });

  it("test_useSupportTickets_passes_empty_object_without_filter", () => {
    mockUseQuery.mockReturnValue([] as ReturnType<typeof useQuery>);

    renderHook(() => useSupportTickets());

    expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {});
  });

  it("test_useSupportTickets_returns_empty_array_not_undefined", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useSupportTickets());

    // Should never return undefined, always an array
    expect(Array.isArray(result.current.tickets)).toBe(true);
  });
});

describe("useMyTickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test_useMyTickets_returns_empty_array_when_loading", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMyTickets());

    expect(result.current.tickets).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("test_useMyTickets_returns_tickets_when_data_available", () => {
    const mockTickets = [makeMockTicket({ _id: "t1" })];
    mockUseQuery.mockReturnValue(mockTickets as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMyTickets());

    expect(result.current.tickets).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  });
});
