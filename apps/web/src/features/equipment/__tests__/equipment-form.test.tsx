import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Mock the entire convex/react module to avoid server-side deps
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue("new-id"),
}));

vi.mock("convex/_generated/api", () => ({
  api: {
    equipment: {
      create: "mock:equipment:create",
      update: "mock:equipment:update",
    },
  },
}));

import { EquipmentForm } from "../components/equipment-form";

describe("EquipmentForm", () => {
  it("renders all required fields in create mode", () => {
    render(
      <EquipmentForm
        mode="create"
        organizationId="org123"
        onSuccess={vi.fn()}
      />,
    );

    // Check for Vietnamese name field
    expect(screen.getByLabelText(/tên \(tiếng việt\)/i)).toBeInTheDocument();

    // Check for English name field
    expect(screen.getByLabelText(/tên \(tiếng anh\)/i)).toBeInTheDocument();

    // Check for category field
    expect(screen.getByLabelText(/danh mục/i)).toBeInTheDocument();

    // Check for submit button
    expect(screen.getByRole("button", { name: /tạo mới/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup();
    render(
      <EquipmentForm
        mode="create"
        organizationId="org123"
        onSuccess={vi.fn()}
      />,
    );

    // Submit without filling required fields
    await user.click(screen.getByRole("button", { name: /tạo mới/i }));

    await waitFor(() => {
      // Should show Vietnamese validation error for nameVi
      expect(
        screen.getByText(
          /tên thiết bị phải có ít nhất 2 ký tự/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for missing nameEn", async () => {
    const user = userEvent.setup();
    render(
      <EquipmentForm
        mode="create"
        organizationId="org123"
        onSuccess={vi.fn()}
      />,
    );

    // Fill nameVi but not nameEn
    await user.type(
      screen.getByLabelText(/tên \(tiếng việt\)/i),
      "Máy đo huyết áp",
    );

    await user.click(screen.getByRole("button", { name: /tạo mới/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/english name must be at least 2 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("does not show status field in edit mode", () => {
    // Use type assertions at the object level to avoid per-field any casts
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mockEquipment = {
      _id: "eq1",
      _creationTime: Date.now(),
      nameVi: "Test",
      nameEn: "Test EN",
      categoryId: "cat1",
      organizationId: "org1",
      status: "available" as const,
      condition: "good" as const,
      criticality: "B" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as import("../types").Equipment;
    render(
      <EquipmentForm
        mode="edit"
        equipment={mockEquipment}
        onSuccess={vi.fn()}
      />,
    );

    // Status select should not appear in edit mode
    expect(screen.queryByLabelText(/trạng thái/i)).not.toBeInTheDocument();
  });

  it("shows 'Lưu' button in edit mode", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mockEquipment = {
      _id: "eq1",
      _creationTime: Date.now(),
      nameVi: "Test",
      nameEn: "Test EN",
      categoryId: "cat1",
      organizationId: "org1",
      status: "available" as const,
      condition: "good" as const,
      criticality: "B" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as import("../types").Equipment;
    render(
      <EquipmentForm
        mode="edit"
        equipment={mockEquipment}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /lưu/i })).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <EquipmentForm
        mode="create"
        organizationId="org123"
        onSuccess={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: /hủy/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
