/**
 * Tests for TicketForm component.
 *
 * WHY: Verifies that:
 * - All form fields render (subject, description, category, priority)
 * - Form validation prevents submission with empty required fields
 * - Submit button text shows bilingual Vietnamese labels
 * - Cancel button triggers onCancel callback
 *
 * vi: "Kiem tra form tao phieu ho tro" / en: "Ticket form component tests"
 */
import { fireEvent, screen } from "@testing-library/react";
import { useMutation } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { TicketForm } from "../ticket-form";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API
vi.mock("@medilink/db/api", () => ({
  api: {
    support: {
      create: "support:create",
      updateStatus: "support:updateStatus",
      addMessage: "support:addMessage",
      listByOrg: "support:listByOrg",
      getById: "support:getById",
      listByUser: "support:listByUser",
    },
  },
}));

const mockUseMutation = vi.mocked(useMutation);

describe("TicketForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(
      vi.fn() as unknown as ReturnType<typeof useMutation>,
    );
  });

  it("test_TicketForm_renders_subject_field", () => {
    renderWithProviders(<TicketForm />);

    const subjectInput = screen.getByLabelText(/Tieu de \(Tieng Viet\)/i);
    expect(subjectInput).toBeInTheDocument();
  });

  it("test_TicketForm_renders_description_field", () => {
    renderWithProviders(<TicketForm />);

    const descriptionInput = screen.getByLabelText(/Mo ta \(Tieng Viet\)/i);
    expect(descriptionInput).toBeInTheDocument();
  });

  it("test_TicketForm_renders_category_selector", () => {
    renderWithProviders(<TicketForm />);

    // The category label should be present
    expect(screen.getByText("Danh muc")).toBeInTheDocument();
  });

  it("test_TicketForm_renders_priority_selector", () => {
    renderWithProviders(<TicketForm />);

    expect(screen.getByText("Muc do uu tien")).toBeInTheDocument();
  });

  it("test_TicketForm_submit_button_shows_vietnamese_label", () => {
    renderWithProviders(<TicketForm />);

    const submitButton = screen.getByRole("button", {
      name: /Tao phieu ho tro/i,
    });
    expect(submitButton).toBeInTheDocument();
  });

  it("test_TicketForm_submit_button_disabled_when_fields_empty", () => {
    renderWithProviders(<TicketForm />);

    const submitButton = screen.getByRole("button", {
      name: /Tao phieu ho tro/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("test_TicketForm_cancel_button_calls_onCancel", () => {
    const onCancel = vi.fn();
    renderWithProviders(<TicketForm onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /Huy/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("test_TicketForm_renders_optional_english_fields", () => {
    renderWithProviders(<TicketForm />);

    const subjectEn = screen.getByLabelText(/Tieu de \(Tieng Anh\)/i);
    expect(subjectEn).toBeInTheDocument();

    const descEn = screen.getByLabelText(/Mo ta \(Tieng Anh\)/i);
    expect(descEn).toBeInTheDocument();
  });
});
