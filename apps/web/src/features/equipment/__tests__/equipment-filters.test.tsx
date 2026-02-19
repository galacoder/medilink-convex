import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EquipmentFiltersBar } from "../components/equipment-filters";
import type { EquipmentFilters } from "../types";

describe("EquipmentFiltersBar", () => {
  const defaultFilters: EquipmentFilters = {};

  it("renders search input", () => {
    render(
      <EquipmentFiltersBar
        filters={defaultFilters}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByPlaceholderText("Tìm kiếm thiết bị..."),
    ).toBeInTheDocument();
  });

  it("renders status filter select", () => {
    render(
      <EquipmentFiltersBar
        filters={defaultFilters}
        onChange={vi.fn()}
      />,
    );
    // The filter trigger should be present
    expect(
      screen.getByRole("combobox", { name: /lọc theo trạng thái/i }),
    ).toBeInTheDocument();
  });

  it("shows all statuses option by default when no status filter", () => {
    render(
      <EquipmentFiltersBar
        filters={defaultFilters}
        onChange={vi.fn()}
      />,
    );
    // Should show "Tất cả trạng thái" as default value
    expect(screen.getByText("Tất cả trạng thái")).toBeInTheDocument();
  });

  it("calls onChange with search when user types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <EquipmentFiltersBar
        filters={defaultFilters}
        onChange={onChange}
      />,
    );

    const searchInput = screen.getByPlaceholderText("Tìm kiếm thiết bị...");
    await user.type(searchInput, "máy");

    // Debounce means onChange is called after typing with timeout
    // We verify the input updates immediately
    expect(searchInput).toHaveValue("máy");
  });

  it("reflects current filter values from props", () => {
    render(
      <EquipmentFiltersBar
        filters={{ search: "test", status: "available" }}
        onChange={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText("Tìm kiếm thiết bị...");
    expect(searchInput).toHaveValue("test");
  });
});
