/**
 * Tests for useProviderMutations hook.
 *
 * WHY: Verifies that all six provider mutations are exposed and callable.
 * Each mutation function is mocked at the convex/react level to avoid
 * needing a live Convex deployment.
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useProviderMutations } from "../use-provider-mutations";

const mockMutationFn = vi.fn().mockResolvedValue("mock_id");

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => mockMutationFn),
}));

describe("useProviderMutations", () => {
  it("test_useProviderMutations_exposesAllMutations", () => {
    const { result } = renderHook(() => useProviderMutations());

    expect(typeof result.current.addServiceOffering).toBe("function");
    expect(typeof result.current.updateServiceOffering).toBe("function");
    expect(typeof result.current.removeServiceOffering).toBe("function");
    expect(typeof result.current.addCertification).toBe("function");
    expect(typeof result.current.setCoverageArea).toBe("function");
    expect(typeof result.current.updateProfile).toBe("function");
  });

  it("test_useProviderMutations_addServiceOfferingIsCallable", async () => {
    const { result } = renderHook(() => useProviderMutations());

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const returnValue = await result.current.addServiceOffering({
      organizationId: "org_001",
      specialty: "calibration",
    });

    expect(returnValue).toBe("mock_id");
  });

  it("test_useProviderMutations_updateProfileIsCallable", async () => {
    const { result } = renderHook(() => useProviderMutations());

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const returnValue = await result.current.updateProfile({
      organizationId: "org_001",
      companyName: "New Company Name",
    });

    expect(returnValue).toBe("mock_id");
  });

  it("test_useProviderMutations_setCoverageAreaIsCallable", async () => {
    const { result } = renderHook(() => useProviderMutations());

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const returnValue = await result.current.setCoverageArea({
      organizationId: "org_001",
      areas: [{ region: "TP. Hồ Chí Minh" }],
    });

    expect(returnValue).toBe("mock_id");
  });
});
