/**
 * Tests for ServiceRequestForm multi-step wizard.
 *
 * WHY: The 3-step form is the most complex UI in this feature. Tests verify
 * step transitions, form data accumulation, and final submission callback.
 * EquipmentSelector is mocked since it depends on Convex queries.
 */
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { renderWithProviders } from "~/test-utils";
import { ServiceRequestForm } from "../service-request-form";

// Mock EquipmentSelector to avoid Convex dependencies in tests
vi.mock("../equipment-selector", () => ({
  EquipmentSelector: ({
    onSelect,
  }: {
    value: string;
    onSelect: (id: string, nameVi: string) => void;
  }) => (
    <div>
      <button
        onClick={() => onSelect("eq_test_001", "Máy đo huyết áp")}
        data-testid="mock-equipment-select"
      >
        Chọn: Máy đo huyết áp
      </button>
    </div>
  ),
}));

describe("ServiceRequestForm", () => {
  const mockOnSubmit = vi.fn();

  it("test_ServiceRequestForm_rendersStep1EquipmentSelect", () => {
    renderWithProviders(<ServiceRequestForm onSubmit={mockOnSubmit} />);

    // Step 1 should show equipment selection
    expect(screen.getByText(/Chọn thiết bị/)).toBeInTheDocument();
    expect(screen.getByTestId("mock-equipment-select")).toBeInTheDocument();
  });

  it("test_ServiceRequestForm_advancesToStep2", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServiceRequestForm onSubmit={mockOnSubmit} />);

    // Select equipment first
    await user.click(screen.getByTestId("mock-equipment-select"));

    // Click next to advance to step 2
    const nextButton = screen.getByRole("button", { name: /Tiếp theo/ });
    await user.click(nextButton);

    // Step 2 should be visible
    await waitFor(() => {
      expect(screen.getByText(/Mô tả vấn đề/)).toBeInTheDocument();
    });
  });

  it("test_ServiceRequestForm_rendersStep2IssueFields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServiceRequestForm onSubmit={mockOnSubmit} />);

    // Navigate to step 2
    await user.click(screen.getByTestId("mock-equipment-select"));
    await user.click(screen.getByRole("button", { name: /Tiếp theo/ }));

    // Step 2 fields should be present
    await waitFor(() => {
      expect(screen.getByText(/Loại vấn đề/)).toBeInTheDocument();
      expect(screen.getByText(/Mức ưu tiên/)).toBeInTheDocument();
      // Multiple "Mô tả chi tiết" labels (Vietnamese + English)
      const descLabels = screen.getAllByText(/Mô tả chi tiết/);
      expect(descLabels.length).toBeGreaterThan(0);
    });
  });

  it("test_ServiceRequestForm_advancesToStep3Review", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServiceRequestForm onSubmit={mockOnSubmit} />);

    // Step 1: select equipment
    await user.click(screen.getByTestId("mock-equipment-select"));
    await user.click(screen.getByRole("button", { name: /Tiếp theo/ }));

    // Step 2: fill description and advance
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Mô tả vấn đề của thiết bị/),
      ).toBeInTheDocument();
    });

    const descInput = screen.getByPlaceholderText(/Mô tả vấn đề của thiết bị/);
    await user.type(descInput, "Thiết bị bị hỏng cần sửa chữa gấp");

    await user.click(screen.getByRole("button", { name: /Tiếp theo/ }));

    // Step 3 review
    await waitFor(() => {
      // Both the CardTitle "Xem lại và gửi" and the h3 "Xem lại thông tin yêu cầu"
      // should be visible on step 3
      const matches = screen.getAllByText(/Xem lại/);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it("test_ServiceRequestForm_submitsFormData", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<ServiceRequestForm onSubmit={onSubmit} />);

    // Step 1
    await user.click(screen.getByTestId("mock-equipment-select"));
    await user.click(screen.getByRole("button", { name: /Tiếp theo/ }));

    // Step 2
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(/Mô tả vấn đề của thiết bị/),
      ).toBeInTheDocument(),
    );
    await user.type(
      screen.getByPlaceholderText(/Mô tả vấn đề của thiết bị/),
      "Thiết bị bị hỏng",
    );
    await user.click(screen.getByRole("button", { name: /Tiếp theo/ }));

    // Step 3: submit
    await waitFor(() => {
      const matches = screen.getAllByText(/Xem lại/);
      expect(matches.length).toBeGreaterThan(0);
    });
    const submitBtn = screen.getByRole("button", { name: /Gửi yêu cầu/ });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          equipmentId: "eq_test_001",
          descriptionVi: "Thiết bị bị hỏng",
        }),
      );
    });
  });

  it("test_ServiceRequestForm_showsValidationErrors", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServiceRequestForm onSubmit={mockOnSubmit} />);

    // Try to advance without selecting equipment
    const nextButton = screen.getByRole("button", { name: /Tiếp theo/ });
    await user.click(nextButton);

    // Should show validation error in Vietnamese
    await waitFor(() => {
      expect(screen.getByText(/Vui lòng chọn thiết bị/)).toBeInTheDocument();
    });
  });
});
