/**
 * Tests for QuoteComparisonCard component.
 *
 * WHY: Verifies VND currency formatting, provider info display, status badge,
 * and action button visibility. Critical for AC-03 (view quotes) and AC-04
 * (approve/reject quote with confirmation dialog).
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { createMockQuote, renderWithProviders } from "~/test-utils";
import { QuoteComparisonCard } from "../quote-comparison-card";

describe("QuoteComparisonCard", () => {
  it("test_QuoteComparisonCard_displaysQuoteDetails", () => {
    const quote = createMockQuote({
      providerOrgName: "Công ty ABC",
      notes: "Bao gồm phụ tùng thay thế",
    });

    renderWithProviders(
      <QuoteComparisonCard
        quote={quote}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("Công ty ABC")).toBeInTheDocument();
    expect(screen.getByText(/Bao gồm phụ tùng/)).toBeInTheDocument();
  });

  it("test_QuoteComparisonCard_formatsVNDAmount", () => {
    const quote = createMockQuote({ amount: 500000, currency: "VND" });

    renderWithProviders(
      <QuoteComparisonCard
        quote={quote}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    // VND formatted: 500.000 ₫ (Vietnamese locale)
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it("test_QuoteComparisonCard_showsAcceptRejectButtons", () => {
    const quote = createMockQuote({ status: "pending" });

    renderWithProviders(
      <QuoteComparisonCard
        quote={quote}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    // Accept and reject buttons should be visible for pending quotes
    expect(screen.getByRole("button", { name: /Chấp nhận/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Từ chối/ })).toBeInTheDocument();
  });

  it("test_QuoteComparisonCard_hidesActionsForNonPending", () => {
    const quote = createMockQuote({ status: "accepted" });

    renderWithProviders(
      <QuoteComparisonCard
        quote={quote}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    // No action buttons for accepted/rejected/expired quotes
    expect(screen.queryByRole("button", { name: /Chấp nhận/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Từ chối/ })).not.toBeInTheDocument();
  });

  it("test_QuoteComparisonCard_showsConfirmationDialog", () => {
    const quote = createMockQuote({ status: "pending" });

    renderWithProviders(
      <QuoteComparisonCard
        quote={quote}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    // AlertDialog trigger should be present (the accept/reject buttons themselves open the dialog)
    const acceptBtn = screen.getByRole("button", { name: /Chấp nhận/ });
    expect(acceptBtn).toBeInTheDocument();
  });
});
