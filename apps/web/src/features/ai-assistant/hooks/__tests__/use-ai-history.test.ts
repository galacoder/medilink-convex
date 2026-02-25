/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-non-null-assertion */

/**
 * Tests for useAiHistory hook.
 *
 * WHY: Verifies the hook correctly wires to Convex queries/mutations
 * for conversation CRUD and provides the expected interface.
 *
 * vi: "Kiem tra hook useAiHistory" / en: "useAiHistory hook tests"
 */
import { act, renderHook } from "@testing-library/react";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAiHistory } from "../use-ai-history";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => vi.fn()),
}));

vi.mock("@medilink/backend", () => ({
  api: {
    aiConversation: {
      list: "aiConversation:list",
      getById: "aiConversation:getById",
      create: "aiConversation:create",
      addMessage: "aiConversation:addMessage",
      remove: "aiConversation:remove",
    },
  },
}));

const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);

describe("useAiHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(undefined);
    mockUseMutation.mockReturnValue(vi.fn());
  });

  it("returns loading true when query is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useAiHistory("org-123"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.conversations).toEqual([]);
  });

  it("returns conversations when query resolves", () => {
    const mockConversations = [
      {
        _id: "conv-1",
        userId: "user-1",
        organizationId: "org-1",
        titleVi: "Hoi thoai 1",
        titleEn: "Conversation 1",
        messages: [],
        model: "stub",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    mockUseQuery.mockReturnValue(mockConversations as any);

    const { result } = renderHook(() => useAiHistory("org-123"));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0]!.titleVi).toBe("Hoi thoai 1");
  });

  it("skips query when organizationId is undefined", () => {
    const { result } = renderHook(() => useAiHistory(undefined));

    expect(result.current.conversations).toEqual([]);
  });

  it("exposes createConversation function", () => {
    const { result } = renderHook(() => useAiHistory("org-123"));

    expect(typeof result.current.createConversation).toBe("function");
  });

  it("exposes deleteConversation function", () => {
    const { result } = renderHook(() => useAiHistory("org-123"));

    expect(typeof result.current.deleteConversation).toBe("function");
  });

  it("exposes addMessage function", () => {
    const { result } = renderHook(() => useAiHistory("org-123"));

    expect(typeof result.current.addMessage).toBe("function");
  });

  it("selectConversation sets selectedConversation", () => {
    const mockConversations = [
      {
        _id: "conv-1",
        userId: "user-1",
        organizationId: "org-1",
        titleVi: "Test",
        titleEn: "Test",
        messages: [],
        model: "stub",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    mockUseQuery.mockReturnValue(mockConversations as any);

    const { result } = renderHook(() => useAiHistory("org-123"));

    expect(result.current.selectedConversation).toBeNull();

    act(() => {
      result.current.selectConversation("conv-1");
    });

    expect(result.current.selectedConversation).not.toBeNull();
    expect(result.current.selectedConversation?._id).toBe("conv-1");
  });

  it("clearSelection resets selectedConversation to null", () => {
    const mockConversations = [
      {
        _id: "conv-1",
        userId: "user-1",
        organizationId: "org-1",
        titleVi: "Test",
        titleEn: "Test",
        messages: [],
        model: "stub",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    mockUseQuery.mockReturnValue(mockConversations as any);

    const { result } = renderHook(() => useAiHistory("org-123"));

    act(() => {
      result.current.selectConversation("conv-1");
    });
    expect(result.current.selectedConversation).not.toBeNull();

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedConversation).toBeNull();
  });
});
