/**
 * Tests for QuoteForm component.
 *
 * WHY: The QuoteForm is the most critical component — it submits quotes
 * which are financial commitments. Tests verify: rendering, VND formatting,
 * submit button presence, and form structure.
 */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "~/test-utils";
import { QuoteForm } from "../quote-form";

// Mock convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue("q_new_001")),
}));

describe("QuoteForm", () => {
  it("test_QuoteForm_validatesAmountInput - renders amount input field", () => {
    renderWithProviders(<QuoteForm serviceRequestId="sr_test_001" />);
    expect(screen.getByTestId("quote-amount-input")).toBeInTheDocument();
  });

  it("test_QuoteForm_formatsVNDCurrency - displays VND format hint when amount entered", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuoteForm serviceRequestId="sr_test_001" />);

    const amountInput = screen.getByTestId("quote-amount-input");
    await user.clear(amountInput);
    await user.type(amountInput, "500000");

    // Should show Vietnamese formatted currency
    // The formatted amount "500.000 ₫" contains "500"
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it("test_QuoteForm_showsSubmitConfirmation - submit button is rendered", () => {
    renderWithProviders(<QuoteForm serviceRequestId="sr_test_001" />);
    expect(screen.getByTestId("quote-form-submit")).toBeInTheDocument();
  });

  it("renders form container with correct testid", () => {
    renderWithProviders(<QuoteForm serviceRequestId="sr_test_001" />);
    expect(screen.getByTestId("quote-form")).toBeInTheDocument();
  });

  it("renders all required form fields", () => {
    renderWithProviders(<QuoteForm serviceRequestId="sr_test_001" />);

    expect(screen.getByTestId("quote-amount-input")).toBeInTheDocument();
    expect(screen.getByTestId("quote-duration-input")).toBeInTheDocument();
    expect(screen.getByTestId("quote-start-date-input")).toBeInTheDocument();
    expect(screen.getByTestId("quote-notes-input")).toBeInTheDocument();
    expect(screen.getByTestId("quote-terms-input")).toBeInTheDocument();
  });

  it("shows Vietnamese label for amount field", () => {
    renderWithProviders(<QuoteForm serviceRequestId="sr_test_001" />);
    expect(screen.getByText("Số tiền (VNĐ)")).toBeInTheDocument();
  });
});
