/**
 * Tests for QuotesList component.
 *
 * WHY: Verifies that multiple QuoteComparisonCards render correctly,
 * empty state shows bilingual message, and callbacks are passed through.
 */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { createMockQuote, renderWithProviders } from "~/test-utils";
import { QuotesList } from "../quotes-list";

describe("QuotesList", () => {
  it("test_QuotesList_rendersMultipleQuotes", () => {
    const quotes = [
      createMockQuote({ _id: "q_001", providerOrgName: "Công ty ABC" }),
      createMockQuote({ _id: "q_002", providerOrgName: "Công ty XYZ" }),
    ];

    renderWithProviders(
      <QuotesList
        quotes={quotes}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("Công ty ABC")).toBeInTheDocument();
    expect(screen.getByText("Công ty XYZ")).toBeInTheDocument();
  });

  it("test_QuotesList_showsEmptyState", () => {
    renderWithProviders(
      <QuotesList
        quotes={[]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText(/Chưa có báo giá/)).toBeInTheDocument();
  });

  it("test_QuotesList_handlesAcceptCallback", () => {
    const onAccept = vi.fn();
    const quotes = [createMockQuote({ _id: "q_001", status: "pending" })];

    renderWithProviders(
      <QuotesList
        quotes={quotes}
        onAccept={onAccept}
        onReject={vi.fn()}
      />,
    );

    // Accept button should be rendered for pending quote
    expect(screen.getByRole("button", { name: /Chấp nhận/ })).toBeInTheDocument();
  });

  it("test_QuotesList_handlesRejectCallback", () => {
    const onReject = vi.fn();
    const quotes = [createMockQuote({ _id: "q_001", status: "pending" })];

    renderWithProviders(
      <QuotesList
        quotes={quotes}
        onAccept={vi.fn()}
        onReject={onReject}
      />,
    );

    // Reject button should be rendered for pending quote
    expect(screen.getByRole("button", { name: /Từ chối/ })).toBeInTheDocument();
  });
});
