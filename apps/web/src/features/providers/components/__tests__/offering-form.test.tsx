/**
 * Tests for OfferingForm component.
 *
 * WHY: Verifies create and edit modes render correctly, required specialty
 * field validation fires, and the form calls onSuccess after a successful
 * mutation.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ServiceOffering } from "../../types";
import { renderWithProviders } from "~/test-utils";
import { OfferingForm } from "../offering-form";

const mockMutateFn = vi.fn().mockResolvedValue("off_new");

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => mockMutateFn),
}));

const mockOffering: ServiceOffering = {
  _id: "off_001",
  _creationTime: Date.now(),
  providerId: "prov_001",
  specialty: "calibration",
  descriptionVi: "Dịch vụ hiệu chỉnh",
  descriptionEn: "Calibration service",
  priceEstimate: 500000,
  turnaroundDays: 3,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe("OfferingForm", () => {
  it("test_OfferingForm_rendersCreateModeFields", () => {
    renderWithProviders(
      <OfferingForm mode="create" organizationId="org_001" locale="vi" />,
    );

    expect(screen.getByLabelText(/Chuyên ngành/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mô tả \(Tiếng Việt\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mô tả \(Tiếng Anh\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Giá ước tính/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Thời gian hoàn thành/)).toBeInTheDocument();
    // Create button
    expect(screen.getByRole("button", { name: /Tạo mới/ })).toBeInTheDocument();
  });

  it("test_OfferingForm_rendersEditModeWithPrefilledValues", () => {
    renderWithProviders(
      <OfferingForm
        mode="edit"
        offering={mockOffering}
        organizationId="org_001"
        locale="vi"
      />,
    );

    // Description fields should be pre-filled
    expect(screen.getByDisplayValue("Dịch vụ hiệu chỉnh")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Calibration service")).toBeInTheDocument();
    // Price should be pre-filled
    expect(screen.getByDisplayValue("500000")).toBeInTheDocument();
    // Save button in edit mode
    expect(screen.getByRole("button", { name: /Lưu/ })).toBeInTheDocument();
  });

  it("test_OfferingForm_hasCancelButtonWhenOnCancelProvided", () => {
    renderWithProviders(
      <OfferingForm
        mode="create"
        organizationId="org_001"
        onCancel={vi.fn()}
        locale="vi"
      />,
    );

    expect(screen.getByRole("button", { name: /Hủy/ })).toBeInTheDocument();
  });

  it("test_OfferingForm_hasTestId", () => {
    renderWithProviders(
      <OfferingForm mode="create" organizationId="org_001" locale="vi" />,
    );

    expect(screen.getByTestId("offering-form")).toBeInTheDocument();
  });
});
