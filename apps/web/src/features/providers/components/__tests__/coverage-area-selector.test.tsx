/**
 * Tests for CoverageAreaSelector component.
 *
 * WHY: Verifies that add/remove region interactions work correctly,
 * onChange callback receives the updated areas array, and the controlled
 * component renders existing values.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { CoverageAreaSelector } from "../coverage-area-selector";

describe("CoverageAreaSelector", () => {
  it("test_CoverageAreaSelector_rendersEmptyState", () => {
    renderWithProviders(
      <CoverageAreaSelector value={[]} onChange={vi.fn()} locale="vi" />,
    );

    expect(screen.getByText("Chưa có khu vực phủ sóng")).toBeInTheDocument();
  });

  it("test_CoverageAreaSelector_addsRegion", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CoverageAreaSelector value={[]} onChange={onChange} locale="vi" />,
    );

    const addButton = screen.getByTestId("add-region-btn");
    await user.click(addButton);

    expect(onChange).toHaveBeenCalledWith([{ region: "", district: "" }]);
  });

  it("test_CoverageAreaSelector_removesRegion", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const initialAreas = [
      { region: "TP. Hồ Chí Minh", district: "Quận 1" },
      { region: "Hà Nội", district: "Ba Đình" },
    ];

    renderWithProviders(
      <CoverageAreaSelector
        value={initialAreas}
        onChange={onChange}
        locale="vi"
      />,
    );

    const removeButtons = screen.getAllByTestId("remove-region-btn");
    // Remove first region (getAllByTestId guarantees at least one result)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await user.click(removeButtons[0]!);

    expect(onChange).toHaveBeenCalledWith([
      { region: "Hà Nội", district: "Ba Đình" },
    ]);
  });

  it("test_CoverageAreaSelector_rendersExistingAreas", () => {
    const areas = [{ region: "TP. Hồ Chí Minh", district: "Quận 1" }];

    renderWithProviders(
      <CoverageAreaSelector value={areas} onChange={vi.fn()} locale="vi" />,
    );

    const regionInputs = screen.getAllByTestId("region-input");
    expect(regionInputs).toHaveLength(1);
    expect(regionInputs[0]).toHaveValue("TP. Hồ Chí Minh");
  });

  it("test_CoverageAreaSelector_callsOnChangeWhenRegionTyped", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const areas = [{ region: "", district: "" }];

    renderWithProviders(
      <CoverageAreaSelector value={areas} onChange={onChange} locale="vi" />,
    );

    const regionInput = screen.getByTestId("region-input");
    await user.type(regionInput, "Đà Nẵng");

    // onChange called for each typed character
    expect(onChange).toHaveBeenCalled();
  });
});
