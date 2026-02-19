/**
 * Tests for OfferingCard component.
 *
 * WHY: Verifies the card correctly renders specialty badge, bilingual
 * descriptions, optional price, turnaround days, and action button callbacks.
 */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "~/test-utils";
import { OfferingCard } from "../offering-card";
import type { ServiceOffering } from "../../types";

const mockOffering: ServiceOffering = {
  _id: "off_001",
  _creationTime: Date.now(),
  providerId: "prov_001",
  specialty: "calibration",
  descriptionVi: "Dịch vụ hiệu chỉnh thiết bị y tế chuyên nghiệp",
  descriptionEn: "Professional medical device calibration service",
  priceEstimate: 500000,
  turnaroundDays: 3,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe("OfferingCard", () => {
  it("test_OfferingCard_rendersSpecialtyBadge", () => {
    renderWithProviders(
      <OfferingCard offering={mockOffering} locale="vi" />,
    );

    const badge = screen.getByTestId("specialty-badge");
    expect(badge).toBeInTheDocument();
    // Vietnamese specialty label for calibration
    expect(badge).toHaveTextContent("Hiệu chỉnh");
  });

  it("test_OfferingCard_rendersVietnameseDescription", () => {
    renderWithProviders(
      <OfferingCard offering={mockOffering} locale="vi" />,
    );

    expect(
      screen.getByText("Dịch vụ hiệu chỉnh thiết bị y tế chuyên nghiệp"),
    ).toBeInTheDocument();
  });

  it("test_OfferingCard_rendersEnglishDescription", () => {
    renderWithProviders(
      <OfferingCard offering={mockOffering} locale="en" />,
    );

    expect(
      screen.getByText("Professional medical device calibration service"),
    ).toBeInTheDocument();
  });

  it("test_OfferingCard_rendersPriceEstimate", () => {
    renderWithProviders(
      <OfferingCard offering={mockOffering} locale="vi" />,
    );

    // Price should be formatted with VND
    expect(screen.getByText(/500\.000 VND/)).toBeInTheDocument();
  });

  it("test_OfferingCard_hidesPriceWhenUndefined", () => {
    const offeringWithoutPrice: ServiceOffering = {
      ...mockOffering,
      priceEstimate: undefined,
    };

    renderWithProviders(
      <OfferingCard offering={offeringWithoutPrice} locale="vi" />,
    );

    expect(screen.queryByText(/VND/)).not.toBeInTheDocument();
  });

  it("test_OfferingCard_callsOnDeleteWhenDeleteClicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <OfferingCard
        offering={mockOffering}
        onDelete={onDelete}
        locale="vi"
      />,
    );

    const deleteButton = screen.getByRole("button", { name: /Xóa/ });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockOffering);
  });

  it("test_OfferingCard_callsOnEditWhenEditClicked", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <OfferingCard offering={mockOffering} onEdit={onEdit} locale="vi" />,
    );

    const editButton = screen.getByRole("button", { name: /Chỉnh sửa/ });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockOffering);
  });

  it("test_OfferingCard_showsTurnaroundDays", () => {
    renderWithProviders(
      <OfferingCard offering={mockOffering} locale="vi" />,
    );

    // "3 ngày" is rendered as two sibling spans: "3" and " ngày"
    // Use a regex that matches the combined text in the parent span
    expect(screen.getByText((_, element) => {
      const isSpan = element?.tagName === "SPAN";
      const hasFontMedium = element?.className.includes("font-medium") === true;
      // textContent optional chain needed because element may be null in the
      // getByText callback context -- suppress unnecessary-condition false positives
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const hasThree = element?.textContent?.includes("3") === true;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const hasNgay = element?.textContent?.includes("ngày") === true;
      return isSpan && hasFontMedium && hasThree && hasNgay;
    })).toBeInTheDocument();
  });
});
