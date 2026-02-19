/**
 * Tests for useQuoteMutations hook.
 *
 * WHY: Verifies that the hook correctly wraps Convex mutations for
 * quote submission and decline request actions with proper typing and
 * real useState-based loading state tracking.
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

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

  it("test_useQuoteMutations_isSubmittingDuringMutation - resolves after submitQuote", async () => {
    let resolveSubmit!: (value: string) => void;
    const deferredPromise = new Promise<string>((resolve) => {
      resolveSubmit = resolve;
    });
    const mockSubmitFn = vi.fn().mockReturnValue(deferredPromise);
    mockUseMutation.mockReturnValue(
      mockSubmitFn as unknown as ReturnType<typeof useMutation>,
    );

    const { result } = renderHook(() => useQuoteMutations());

    // Start the mutation
    let submitPromise: Promise<string>;
    act(() => {
      submitPromise = result.current.submitQuote({
        serviceRequestId: "sr_test_001" as Parameters<typeof result.current.submitQuote>[0]["serviceRequestId"],
        amount: 500000,
      });
    });

    // Resolve and verify it completes
    await act(async () => {
      resolveSubmit("q_new_001");
      await submitPromise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it("test_useQuoteMutations_isDecliningDuringMutation - resolves after declineRequest", async () => {
    let resolveDecline!: (value: { success: boolean }) => void;
    const deferredPromise = new Promise<{ success: boolean }>((resolve) => {
      resolveDecline = resolve;
    });
    const mockDeclineFn = vi.fn().mockReturnValue(deferredPromise);
    mockUseMutation.mockReturnValue(
      mockDeclineFn as unknown as ReturnType<typeof useMutation>,
    );

    const { result } = renderHook(() => useQuoteMutations());

    let declinePromise: Promise<{ success: boolean }>;
    act(() => {
      declinePromise = result.current.declineRequest({
        serviceRequestId: "sr_test_001" as Parameters<typeof result.current.declineRequest>[0]["serviceRequestId"],
        reason: "Không phù hợp với lịch làm việc hiện tại",
      });
    });

    await act(async () => {
      resolveDecline({ success: true });
      await declinePromise;
    });

    expect(result.current.isDeclining).toBe(false);
  });

  it("test_submitQuote_passesEstimatedDurationDaysAndAvailableStartDate - passes new fields to Convex mutation", async () => {
    const mockSubmitFn = vi.fn().mockResolvedValue("q_new_002");
    mockUseMutation.mockReturnValue(
      mockSubmitFn as unknown as ReturnType<typeof useMutation>,
    );

    const { result } = renderHook(() => useQuoteMutations());

    await act(async () => {
      await result.current.submitQuote({
        serviceRequestId: "sr_test_001" as Parameters<typeof result.current.submitQuote>[0]["serviceRequestId"],
        amount: 1000000,
        currency: "VND",
        estimatedDurationDays: 5,
        availableStartDate: 1709942400000,
      });
    });

    expect(mockSubmitFn).toHaveBeenCalledWith({
      serviceRequestId: "sr_test_001",
      amount: 1000000,
      currency: "VND",
      estimatedDurationDays: 5,
      availableStartDate: 1709942400000,
    });
  });
});
