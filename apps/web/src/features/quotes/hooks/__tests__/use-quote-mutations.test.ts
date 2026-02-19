/**
 * Tests for useQuoteMutations hook.
 *
 * WHY: Verifies that the hook correctly wraps Convex mutations for
 * quote submission and decline request actions with proper typing.
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useQuoteMutations } from "../use-quote-mutations";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

import { useMutation } from "convex/react";

const mockUseMutation = vi.mocked(useMutation);

describe("useQuoteMutations", () => {
  it("test_useQuoteMutations_submitQuote - returns submitQuote function", () => {
    const mockSubmitFn = vi.fn().mockResolvedValue("q_new_001");
    mockUseMutation.mockReturnValue(
      mockSubmitFn as unknown as ReturnType<typeof useMutation>,
    );

    const { result } = renderHook(() => useQuoteMutations());

    expect(typeof result.current.submitQuote).toBe("function");
  });

  it("test_useQuoteMutations_declineRequest - returns declineRequest function", () => {
    const mockDeclineFn = vi
      .fn()
      .mockResolvedValue({ success: true });
    mockUseMutation.mockReturnValue(
      mockDeclineFn as unknown as ReturnType<typeof useMutation>,
    );

    const { result } = renderHook(() => useQuoteMutations());

    expect(typeof result.current.declineRequest).toBe("function");
  });

  it("calls the correct Convex mutation for submitQuote", async () => {
    const mockSubmitFn = vi.fn().mockResolvedValue("q_new_001");
    mockUseMutation.mockReturnValue(
      mockSubmitFn as unknown as ReturnType<typeof useMutation>,
    );

    const { result } = renderHook(() => useQuoteMutations());

    await result.current.submitQuote({
      serviceRequestId: "sr_test_001" as Parameters<typeof result.current.submitQuote>[0]["serviceRequestId"],
      amount: 500000,
      currency: "VND",
    });

    expect(mockSubmitFn).toHaveBeenCalledWith({
      serviceRequestId: "sr_test_001",
      amount: 500000,
      currency: "VND",
    });
  });

  it("exposes isSubmitting and isDeclining flags", () => {
    const mockFn = vi.fn();
    mockUseMutation.mockReturnValue(
      mockFn as unknown as ReturnType<typeof useMutation>,
    );

    const { result } = renderHook(() => useQuoteMutations());

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDeclining).toBe(false);
  });
});
