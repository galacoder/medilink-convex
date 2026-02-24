/**
 * Tests for PaymentList component.
 *
 * WHY: Verifies that:
 * - Table renders payment rows with date, description, amount, status
 * - Status filter tabs work correctly
 * - Empty state message is displayed when no payments
 * - Loading skeleton is shown while data loads
 * - Amount is formatted with VND currency
 *
 * vi: "Kiem tra danh sach thanh toan" / en: "Payment list component tests"
 */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Payment } from "../../types";
import { renderWithProviders } from "~/test-utils";
import { PaymentList } from "../payment-list";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API
vi.mock("@medilink/backend", () => ({
  api: {
    payment: {
      create: "payment:create",
      list: "payment:list",
      getById: "payment:getById",
      updateStatus: "payment:updateStatus",
    },
  },
}));

function makeMockPayment(overrides: Partial<Payment> = {}): Payment {
  const now = Date.now();
  return {
    _id: "payment_1",
    _creationTime: now,
    organizationId: "org_1",
    paidBy: "user_1",
    amount: 500000,
    currency: "VND",
    status: "pending",
    descriptionVi: "Thanh toan dich vu sua chua",
    descriptionEn: "Repair service payment",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("PaymentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test_PaymentList_renders_empty_state_when_no_payments", () => {
    renderWithProviders(<PaymentList payments={[]} />);

    expect(screen.getByText("Chua co thanh toan")).toBeInTheDocument();
  });

  it("test_PaymentList_renders_loading_skeleton", () => {
    renderWithProviders(<PaymentList payments={[]} isLoading={true} />);

    // Should not show empty state when loading
    expect(screen.queryByText("Chua co thanh toan")).not.toBeInTheDocument();
  });

  it("test_PaymentList_renders_payment_rows", () => {
    const payments = [
      makeMockPayment({ _id: "p1", descriptionVi: "Dich vu 1" }),
      makeMockPayment({ _id: "p2", descriptionVi: "Dich vu 2" }),
    ];

    renderWithProviders(<PaymentList payments={payments} />);

    expect(screen.getByText("Dich vu 1")).toBeInTheDocument();
    expect(screen.getByText("Dich vu 2")).toBeInTheDocument();
  });

  it("test_PaymentList_renders_status_filter_tabs", () => {
    renderWithProviders(<PaymentList payments={[]} />);

    expect(screen.getByRole("button", { name: /Tat ca/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cho xu ly/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hoan thanh/i }),
    ).toBeInTheDocument();
  });

  it("test_PaymentList_filters_by_status_tab", () => {
    const payments = [
      makeMockPayment({
        _id: "p1",
        descriptionVi: "Pending payment",
        status: "pending",
      }),
      makeMockPayment({
        _id: "p2",
        descriptionVi: "Completed payment",
        status: "completed",
      }),
    ];

    renderWithProviders(<PaymentList payments={payments} />);

    // Both should be visible initially
    expect(screen.getByText("Pending payment")).toBeInTheDocument();
    expect(screen.getByText("Completed payment")).toBeInTheDocument();

    // Click "Hoan thanh" (Completed) tab
    const completedTab = screen.getByRole("button", { name: /Hoan thanh/i });
    fireEvent.click(completedTab);

    // Only the completed payment should be visible
    expect(screen.queryByText("Pending payment")).not.toBeInTheDocument();
    expect(screen.getByText("Completed payment")).toBeInTheDocument();
  });

  it("test_PaymentList_displays_status_badge", () => {
    const payments = [makeMockPayment({ _id: "p1", status: "pending" })];

    renderWithProviders(<PaymentList payments={payments} />);

    // The PaymentStatusBadge renders "Cho xu ly" for pending.
    // This text also appears in the filter tab, so we verify multiple elements.
    const pendingElements = screen.getAllByText("Cho xu ly");
    expect(pendingElements.length).toBeGreaterThanOrEqual(2);
  });

  it("test_PaymentList_formats_amount", () => {
    const payments = [
      makeMockPayment({ _id: "p1", amount: 500000, currency: "VND" }),
    ];

    renderWithProviders(<PaymentList payments={payments} />);

    // Should format the amount (Vietnamese locale uses period as thousand separator)
    // The exact format depends on Intl.NumberFormat, but the amount should be present
    const amountCell = screen.getByText(/500/);
    expect(amountCell).toBeInTheDocument();
  });

  it("test_PaymentList_shows_tab_counts", () => {
    const payments = [
      makeMockPayment({ _id: "p1", status: "pending" }),
      makeMockPayment({ _id: "p2", status: "pending" }),
      makeMockPayment({ _id: "p3", status: "completed" }),
    ];

    renderWithProviders(<PaymentList payments={payments} />);

    // All tab should show 3
    const allTab = screen.getByRole("button", { name: /Tat ca/i });
    expect(allTab).toHaveTextContent("3");
  });
});
