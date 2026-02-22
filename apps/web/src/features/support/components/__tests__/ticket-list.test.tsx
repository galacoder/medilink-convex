/**
 * Tests for TicketList component.
 *
 * WHY: Verifies that:
 * - Table renders ticket rows with subject, category, priority, status, date
 * - Status filter tabs work correctly
 * - Empty state message is displayed when no tickets
 * - Loading skeleton is shown while data loads
 * - Clicking a row triggers onTicketClick callback
 *
 * vi: "Kiem tra danh sach phieu ho tro" / en: "Ticket list component tests"
 */
import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock convex/react (needed for sub-components)
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API
vi.mock("convex/_generated/api", () => ({
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

import { renderWithProviders } from "~/test-utils";
import type { SupportTicket } from "../../types";
import { TicketList } from "../ticket-list";

function makeMockTicket(overrides: Partial<SupportTicket> = {}): SupportTicket {
  const now = Date.now();
  return {
    _id: "ticket_1",
    _creationTime: now,
    organizationId: "org_1",
    createdBy: "user_1",
    status: "open",
    priority: "medium",
    category: "general",
    subjectVi: "Van de ky thuat",
    subjectEn: "Technical issue",
    descriptionVi: "Mo ta chi tiet",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("TicketList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test_TicketList_renders_empty_state_when_no_tickets", () => {
    renderWithProviders(<TicketList tickets={[]} />);

    expect(screen.getByText("Chua co yeu cau ho tro")).toBeInTheDocument();
  });

  it("test_TicketList_renders_loading_skeleton", () => {
    renderWithProviders(<TicketList tickets={[]} isLoading={true} />);

    // Should not show empty state when loading
    expect(
      screen.queryByText("Chua co yeu cau ho tro"),
    ).not.toBeInTheDocument();
  });

  it("test_TicketList_renders_ticket_rows", () => {
    const tickets = [
      makeMockTicket({ _id: "t1", subjectVi: "Van de 1" }),
      makeMockTicket({ _id: "t2", subjectVi: "Van de 2" }),
    ];

    renderWithProviders(<TicketList tickets={tickets} />);

    expect(screen.getByText("Van de 1")).toBeInTheDocument();
    expect(screen.getByText("Van de 2")).toBeInTheDocument();
  });

  it("test_TicketList_renders_status_filter_tabs", () => {
    renderWithProviders(<TicketList tickets={[]} />);

    expect(screen.getByRole("button", { name: /Tat ca/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Mo/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Dang xu ly/i }),
    ).toBeInTheDocument();
  });

  it("test_TicketList_filters_by_status_tab", () => {
    const tickets = [
      makeMockTicket({ _id: "t1", subjectVi: "Open ticket", status: "open" }),
      makeMockTicket({
        _id: "t2",
        subjectVi: "Closed ticket",
        status: "closed",
      }),
    ];

    renderWithProviders(<TicketList tickets={tickets} />);

    // Both should be visible in "All" tab
    expect(screen.getByText("Open ticket")).toBeInTheDocument();
    expect(screen.getByText("Closed ticket")).toBeInTheDocument();

    // Click the "Da dong" (Closed) tab
    const closedTab = screen.getByRole("button", { name: /Da dong/i });
    fireEvent.click(closedTab);

    // Only the closed ticket should be visible
    expect(screen.queryByText("Open ticket")).not.toBeInTheDocument();
    expect(screen.getByText("Closed ticket")).toBeInTheDocument();
  });

  it("test_TicketList_shows_ticket_counts_in_tabs", () => {
    const tickets = [
      makeMockTicket({ _id: "t1", status: "open" }),
      makeMockTicket({ _id: "t2", status: "open" }),
      makeMockTicket({ _id: "t3", status: "closed" }),
    ];

    renderWithProviders(<TicketList tickets={tickets} />);

    // "All" tab should show count of 3
    const allTab = screen.getByRole("button", { name: /Tat ca/i });
    expect(allTab).toHaveTextContent("3");
  });

  it("test_TicketList_row_click_triggers_callback", () => {
    const onTicketClick = vi.fn();
    const tickets = [makeMockTicket({ _id: "t1", subjectVi: "Click me" })];

    renderWithProviders(
      <TicketList tickets={tickets} onTicketClick={onTicketClick} />,
    );

    const row = screen.getByText("Click me").closest("tr");
    if (row) fireEvent.click(row);

    expect(onTicketClick).toHaveBeenCalledWith("t1");
  });

  it("test_TicketList_displays_category_label", () => {
    const tickets = [
      makeMockTicket({ _id: "t1", category: "technical" }),
    ];

    renderWithProviders(<TicketList tickets={tickets} />);

    expect(screen.getByText("Ky thuat")).toBeInTheDocument();
  });
});
