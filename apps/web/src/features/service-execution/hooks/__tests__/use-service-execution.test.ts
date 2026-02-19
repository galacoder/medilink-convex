/**
 * Tests for useServiceExecution hook.
 *
 * WHY: Verifies that the hook correctly wraps the execution mutations
 * (startService, updateProgress, completeService, submitCompletionReport)
 * and provides proper loading state management.
 */
import { renderHook } from "@testing-library/react";
import { useMutation } from "convex/react";
import { describe, expect, it, vi } from "vitest";

import { useServiceExecution } from "../use-service-execution";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn().mockReturnValue(vi.fn()),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseMutation = vi.mocked(useMutation) as any;

describe("useServiceExecution", () => {
  it("test_useServiceExecution_returnsMutationFunctions - returns all execution mutations", () => {
    const mockMutationFn = vi.fn().mockResolvedValue("sr_id");
    mockUseMutation.mockReturnValue(mockMutationFn);

    const { result } = renderHook(() => useServiceExecution());

    expect(result.current.startService).toBeDefined();
    expect(result.current.updateProgress).toBeDefined();
    expect(result.current.completeService).toBeDefined();
    expect(result.current.submitCompletionReport).toBeDefined();
  });

  it("provides isSubmitting state for each mutation", () => {
    const mockMutationFn = vi.fn().mockResolvedValue("sr_id");
    mockUseMutation.mockReturnValue(mockMutationFn);

    const { result } = renderHook(() => useServiceExecution());

    // Should have isSubmitting state that starts false
    expect(result.current.isSubmitting).toBe(false);
  });
});
