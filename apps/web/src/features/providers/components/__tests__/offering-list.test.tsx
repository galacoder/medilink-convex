/**
 * Tests for OfferingList component.
 *
 * WHY: Verifies empty state message in Vietnamese, correct card count rendering,
 * skeleton display during loading, and add offering callback invocation.
 */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "~/test-utils";
import { OfferingList } from "../offering-list";
import type { ServiceOffering } from "../../types";

const makeOffering = (id: string, specialty: ServiceOffering["specialty"] = "calibration"): ServiceOffering => ({
  _id: id,
  _creationTime: Date.now(),
  providerId: "prov_001",
  specialty,
  descriptionVi: `Mô tả ${id}`,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe("OfferingList", () => {
  it("test_OfferingList_showsEmptyStateInVietnamese", () => {
    renderWithProviders(
      <OfferingList offerings={[]} locale="vi" />,
    );

    expect(screen.getByText("Chưa có dịch vụ nào")).toBeInTheDocument();
  });

  it("test_OfferingList_rendersCorrectNumberOfCards", () => {
    const offerings = [
      makeOffering("off_001", "calibration"),
      makeOffering("off_002", "general_repair"),
      makeOffering("off_003", "installation"),
    ];

    renderWithProviders(
      <OfferingList offerings={offerings} locale="vi" />,
    );

    // Each offering card has a specialty badge
    const badges = screen.getAllByTestId("specialty-badge");
    expect(badges).toHaveLength(3);
  });

  it("test_OfferingList_showsSkeletonWhenLoading", () => {
    renderWithProviders(
      <OfferingList offerings={[]} isLoading={true} />,
    );

    expect(screen.getByTestId("offering-list-skeleton")).toBeInTheDocument();
    // Empty state should not appear while loading
    expect(screen.queryByText("Chưa có dịch vụ nào")).not.toBeInTheDocument();
  });

  it("test_OfferingList_hasCorrectTestId", () => {
    renderWithProviders(
      <OfferingList offerings={[]} locale="vi" />,
    );

    expect(screen.getByTestId("offering-list")).toBeInTheDocument();
  });

  it("test_OfferingList_callsOnAddWhenButtonClicked", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <OfferingList offerings={[]} onAdd={onAdd} locale="vi" />,
    );

    const addButton = screen.getByRole("button", { name: /Thêm dịch vụ/ });
    await user.click(addButton);

    expect(onAdd).toHaveBeenCalledOnce();
  });
});
