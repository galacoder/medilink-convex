/**
 * Tests for useAiAssistant hook.
 *
 * WHY: Verifies that the hook wraps Convex action functions correctly
 * and returns the expected interface for consuming components.
 *
 * vi: "Kiểm tra hook useAiAssistant" / en: "useAiAssistant hook tests"
 */
import { renderHook } from "@testing-library/react";
import { useAction } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAiAssistant } from "../use-ai-assistant";

// Mock convex/react before importing the hook
vi.mock("convex/react", () => ({
  useAction: vi.fn(() => vi.fn()),
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API so api.aiAssistant is defined
vi.mock("@medilink/backend", () => ({
  api: {
    aiAssistant: {
      queryEquipment: "aiAssistant:queryEquipment",
      draftServiceRequest: "aiAssistant:draftServiceRequest",
      answerAnalyticsQuestion: "aiAssistant:answerAnalyticsQuestion",
    },
  },
}));

const mockUseAction = vi.mocked(useAction);

describe("useAiAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAction.mockReturnValue(vi.fn());
  });

  it("test_useAiAssistant_exposes_queryEquipment_function", () => {
    const { result } = renderHook(() => useAiAssistant());

    expect(typeof result.current.queryEquipment).toBe("function");
  });

  it("test_useAiAssistant_exposes_draftServiceRequest_function", () => {
    const { result } = renderHook(() => useAiAssistant());

    expect(typeof result.current.draftServiceRequest).toBe("function");
  });

  it("test_useAiAssistant_exposes_answerAnalyticsQuestion_function", () => {
    const { result } = renderHook(() => useAiAssistant());

    expect(typeof result.current.answerAnalyticsQuestion).toBe("function");
  });

  it("test_useAiAssistant_initializes_with_not_loading", () => {
    const { result } = renderHook(() => useAiAssistant());

    expect(result.current.isLoading).toBe(false);
  });

  it("test_useAiAssistant_initializes_with_no_error", () => {
    const { result } = renderHook(() => useAiAssistant());

    expect(result.current.error).toBeNull();
  });
});
