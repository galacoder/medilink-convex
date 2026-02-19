/**
 * Tests for useServiceRequestMutations hook.
 *
 * WHY: Verifies that the hook correctly wraps Convex mutations and manages
 * loading state flags (isCreating, isCancelling, etc.) during async operations.
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createMockCreateInput } from "~/test-utils";
import { useServiceRequestMutations } from "../use-service-request-mutations";

// Mock useMutation to return a spy function we can control
const mockCreate = vi.fn();
const mockCancel = vi.fn();
const mockAccept = vi.fn();
const mockReject = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn((fnRef: string) => {
    if (fnRef === "serviceRequests:create") return mockCreate;
    if (fnRef === "serviceRequests:cancel") return mockCancel;
    if (fnRef === "quotes:accept") return mockAccept;
    if (fnRef === "quotes:reject") return mockReject;
    return vi.fn();
  }),
}));

describe("useServiceRequestMutations", () => {
  it("test_useServiceRequestMutations_createRequest", async () => {
    mockCreate.mockResolvedValue("sr_new_001");

    const { result } = renderHook(() => useServiceRequestMutations());
    const input = createMockCreateInput();

    let returnedId: string | undefined;
    await act(async () => {
      returnedId = await result.current.createRequest(input);
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "repair",
        priority: "medium",
        descriptionVi: "Thiết bị bị hỏng cần sửa chữa",
      }),
    );
    expect(returnedId).toBe("sr_new_001");
    expect(result.current.isCreating).toBe(false);
  });

  it("test_useServiceRequestMutations_cancelRequest", async () => {
    mockCancel.mockResolvedValue("sr_001");

    const { result } = renderHook(() => useServiceRequestMutations());

    await act(async () => {
      await result.current.cancelRequest("sr_001");
    });

    expect(mockCancel).toHaveBeenCalledWith({ id: "sr_001" });
    expect(result.current.isCancelling).toBe(false);
  });

  it("test_useServiceRequestMutations_handlesError", async () => {
    const error = new Error("Convex mutation failed");
    mockCreate.mockRejectedValue(error);

    const { result } = renderHook(() => useServiceRequestMutations());
    const input = createMockCreateInput();

    await act(async () => {
      await expect(result.current.createRequest(input)).rejects.toThrow(
        "Convex mutation failed",
      );
    });

    // isCreating should reset to false even after error
    expect(result.current.isCreating).toBe(false);
  });

  it("test_useServiceRequestMutations_acceptQuote", async () => {
    mockAccept.mockResolvedValue(undefined);

    const { result } = renderHook(() => useServiceRequestMutations());

    await act(async () => {
      await result.current.acceptQuote("q_001");
    });

    expect(mockAccept).toHaveBeenCalledWith({ id: "q_001" });
    expect(result.current.isAccepting).toBe(false);
  });

  it("test_useServiceRequestMutations_rejectQuote", async () => {
    mockReject.mockResolvedValue(undefined);

    const { result } = renderHook(() => useServiceRequestMutations());

    await act(async () => {
      await result.current.rejectQuote("q_001");
    });

    expect(mockReject).toHaveBeenCalledWith({ id: "q_001" });
    expect(result.current.isRejecting).toBe(false);
  });
});
