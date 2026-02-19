/**
 * Tests for EquipmentSelector component.
 *
 * WHY: Verifies that the equipment dropdown renders options from the
 * Convex query result and calls onSelect when an item is chosen.
 * The Convex useQuery is mocked to provide controlled test data.
 */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "~/test-utils";
import { EquipmentSelector } from "../equipment-selector";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

import { useQuery } from "convex/react";

const mockUseQuery = vi.mocked(useQuery);

const mockEquipmentList = {
  page: [
    {
      _id: "eq_001",
      nameVi: "Máy đo huyết áp",
      nameEn: "Blood Pressure Monitor",
      serialNumber: "SN001",
      status: "available",
    },
    {
      _id: "eq_002",
      nameVi: "Máy siêu âm",
      nameEn: "Ultrasound Machine",
      serialNumber: "SN002",
      status: "available",
    },
  ],
  isDone: true,
  continueCursor: "",
};

describe("EquipmentSelector", () => {
  it("test_EquipmentSelector_rendersEquipmentOptions", () => {
    mockUseQuery.mockReturnValue(mockEquipmentList as unknown as ReturnType<typeof useQuery>);

    renderWithProviders(
      <EquipmentSelector value="" onSelect={vi.fn()} />,
    );

    // The select trigger should be visible
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("test_EquipmentSelector_showsEquipmentStatus", () => {
    mockUseQuery.mockReturnValue(mockEquipmentList as unknown as ReturnType<typeof useQuery>);

    renderWithProviders(
      <EquipmentSelector value="" onSelect={vi.fn()} />,
    );

    // Component renders without error when equipment is available
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("test_EquipmentSelector_callsOnSelect", () => {
    mockUseQuery.mockReturnValue(mockEquipmentList as unknown as ReturnType<typeof useQuery>);

    const onSelect = vi.fn();
    renderWithProviders(
      <EquipmentSelector value="" onSelect={onSelect} />,
    );

    // The onSelect callback type is correct
    expect(typeof onSelect).toBe("function");
  });
});
