import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EquipmentCard } from "../components/equipment-card";
import type { Equipment } from "../types";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

const mockEquipment: Equipment = {
  _id: "eq123" as Equipment["_id"],
  _creationTime: Date.now(),
  nameVi: "Máy đo huyết áp",
  nameEn: "Blood Pressure Monitor",
  descriptionVi: "Thiết bị đo huyết áp tự động",
  descriptionEn: "Automatic blood pressure measuring device",
  categoryId: "cat123" as Equipment["categoryId"],
  organizationId: "org123" as Equipment["organizationId"],
  status: "available",
  condition: "good",
  criticality: "B",
  serialNumber: "SN-001",
  model: "OMRON-HEM",
  manufacturer: "OMRON",
  location: "Phòng 101",
  purchaseDate: Date.now(),
  warrantyExpiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe("EquipmentCard", () => {
  it("renders equipment Vietnamese name", () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText("Máy đo huyết áp")).toBeInTheDocument();
  });

  it("renders equipment English name", () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText("Blood Pressure Monitor")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText("Sẵn sàng")).toBeInTheDocument();
  });

  it("renders equipment location when provided", () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText("Phòng 101")).toBeInTheDocument();
  });

  it("renders serial number when provided", () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText("SN-001")).toBeInTheDocument();
  });

  it("renders model when provided", () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText("OMRON-HEM")).toBeInTheDocument();
  });

  it("renders criticality badge", () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    // B criticality = "Quan trọng vừa"
    expect(screen.getByText("Quan trọng vừa")).toBeInTheDocument();
  });

  it("renders damaged status badge with correct style", () => {
    const damagedEquipment: Equipment = {
      ...mockEquipment,
      status: "damaged",
    };
    render(<EquipmentCard equipment={damagedEquipment} />);
    expect(screen.getByText("Hỏng")).toBeInTheDocument();
  });

  it("does not show location label when location is missing", () => {
    const equipmentWithoutLocation: Equipment = {
      ...mockEquipment,
      location: undefined,
    };
    render(<EquipmentCard equipment={equipmentWithoutLocation} />);
    // Should not show location field
    expect(screen.queryByText("Vị trí:")).not.toBeInTheDocument();
  });
});
