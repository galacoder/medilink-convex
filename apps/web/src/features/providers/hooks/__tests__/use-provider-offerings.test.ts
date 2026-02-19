/**
 * Tests for useProviderOfferings hook.
 *
 * WHY: Hooks are tested by mocking the Convex useQuery to return controlled
 * data, isolating the hook's loading logic and return shape from the
 * actual Convex runtime.
 */
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";

import { useProviderOfferings } from "../use-provider-offerings";

// Mock convex/react so tests don't need a live Convex deployment.
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);

describe("useProviderOfferings", () => {
  it("test_useProviderOfferings_returnsOfferingsArray", () => {
    const mockOfferings = [
      {
        _id: "off_001",
        _creationTime: Date.now(),
        providerId: "prov_001",
        specialty: "calibration" as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        _id: "off_002",
        _creationTime: Date.now(),
        providerId: "prov_001",
        specialty: "general_repair" as const,
        priceEstimate: 500000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    mockUseQuery.mockReturnValue(
      mockOfferings as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useProviderOfferings("org_test_001"));

    expect(result.current.offerings).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
  });

  it("test_useProviderOfferings_handlesLoadingState", () => {
    // Convex returns undefined while loading
    mockUseQuery.mockReturnValue(
      undefined as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useProviderOfferings("org_test_001"));

    expect(result.current.offerings).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("test_useProviderOfferings_returnsEmptyArrayForNoOfferings", () => {
    mockUseQuery.mockReturnValue([] as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useProviderOfferings("org_test_001"));

    expect(result.current.offerings).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
