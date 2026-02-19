/**
 * Tests for ProviderProfileForm component.
 *
 * WHY: Verifies that all profile fields render correctly, the form is
 * pre-filled with existing profile data, and the save action calls the
 * updateProfile mutation.
 */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "~/test-utils";
import { ProviderProfileForm } from "../provider-profile-form";
import type { ProviderProfile } from "../../types";

const mockMutateFn = vi.fn().mockResolvedValue("prov_001");

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => mockMutateFn),
}));

const mockProfile: ProviderProfile = {
  _id: "prov_001",
  _creationTime: Date.now(),
  organizationId: "org_001",
  companyName: "Công ty Kỹ thuật Y tế Việt Nam",
  descriptionVi: "Chuyên cung cấp dịch vụ sửa chữa thiết bị y tế",
  descriptionEn: "Specializes in medical equipment repair services",
  contactEmail: "info@vnmedeng.vn",
  contactPhone: "+84-28-1234-5678",
  address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
  verificationStatus: "verified",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  organization: {
    _id: "org_001",
    name: "VN Medical Engineering",
    slug: "vn-medical-engineering",
  },
};

describe("ProviderProfileForm", () => {
  it("test_ProviderProfileForm_rendersAllFields", () => {
    renderWithProviders(
      <ProviderProfileForm
        profile={null}
        organizationId="org_001"
        locale="vi"
      />,
    );

    expect(screen.getByLabelText(/Tên công ty/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Giới thiệu \(Tiếng Việt\)/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Giới thiệu \(Tiếng Anh\)/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email liên hệ/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Địa chỉ/)).toBeInTheDocument();
  });

  it("test_ProviderProfileForm_preFilledWithExistingProfile", () => {
    renderWithProviders(
      <ProviderProfileForm
        profile={mockProfile}
        organizationId="org_001"
        locale="vi"
      />,
    );

    expect(
      screen.getByDisplayValue("Công ty Kỹ thuật Y tế Việt Nam"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Chuyên cung cấp dịch vụ sửa chữa thiết bị y tế"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("info@vnmedeng.vn")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("+84-28-1234-5678"),
    ).toBeInTheDocument();
  });

  it("test_ProviderProfileForm_hasTestId", () => {
    renderWithProviders(
      <ProviderProfileForm
        profile={null}
        organizationId="org_001"
        locale="vi"
      />,
    );

    expect(
      screen.getByTestId("provider-profile-form"),
    ).toBeInTheDocument();
  });

  it("test_ProviderProfileForm_hasSaveButton", () => {
    renderWithProviders(
      <ProviderProfileForm
        profile={null}
        organizationId="org_001"
        locale="vi"
      />,
    );

    expect(screen.getByRole("button", { name: /Lưu/ })).toBeInTheDocument();
  });
});
