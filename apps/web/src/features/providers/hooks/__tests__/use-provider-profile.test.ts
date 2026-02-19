/**
 * Tests for useProviderProfile hook.
 *
 * WHY: Hooks are tested by mocking the Convex useQuery to return controlled
 * data. Since the hook calls useQuery twice (profile + certifications),
 * we use mockReturnValueOnce for sequential call control.
 */
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";

import { useProviderProfile } from "../use-provider-profile";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);

const mockProfile = {
  _id: "prov_001",
  _creationTime: Date.now(),
  organizationId: "org_001",
  companyName: "Công ty Kỹ thuật Y tế Việt Nam",
  contactEmail: "info@vnmedeng.vn",
  verificationStatus: "verified" as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  organization: {
    _id: "org_001",
    name: "VN Medical Engineering",
    slug: "vn-medical-engineering",
  },
};

const mockCertifications = [
  {
    _id: "cert_001",
    _creationTime: Date.now(),
    providerId: "prov_001",
    nameVi: "Chứng nhận ISO 13485",
    nameEn: "ISO 13485 Certification",
    issuingBody: "ISO",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe("useProviderProfile", () => {
  it("test_useProviderProfile_returnsProfileData", () => {
    // Two calls: getProfile, then getCertifications
    mockUseQuery
      .mockReturnValueOnce(
        mockProfile as unknown as ReturnType<typeof useQuery>,
      )
      .mockReturnValueOnce(
        mockCertifications as unknown as ReturnType<typeof useQuery>,
      );

    const { result } = renderHook(() => useProviderProfile("org_001"));

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.isLoading).toBe(false);
  });

  it("test_useProviderProfile_returnsCertifications", () => {
    mockUseQuery
      .mockReturnValueOnce(
        mockProfile as unknown as ReturnType<typeof useQuery>,
      )
      .mockReturnValueOnce(
        mockCertifications as unknown as ReturnType<typeof useQuery>,
      );

    const { result } = renderHook(() => useProviderProfile("org_001"));

    expect(result.current.certifications).toHaveLength(1);
    expect(result.current.certifications[0]?.nameVi).toBe(
      "Chứng nhận ISO 13485",
    );
  });

  it("test_useProviderProfile_handlesLoadingState", () => {
    // Both return undefined (loading)
    mockUseQuery.mockReturnValue(
      undefined as unknown as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useProviderProfile("org_001"));

    expect(result.current.profile).toBeNull();
    expect(result.current.certifications).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });
});
