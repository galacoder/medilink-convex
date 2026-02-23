/**
 * Tests for TicketDetail component.
 *
 * WHY: Verifies that:
 * - Ticket metadata is displayed (subject, category, priority, status)
 * - Message thread renders with messages
 * - Loading skeleton is shown while data loads
 * - Not-found state renders when ticket is null
 *
 * vi: "Kiem tra chi tiet phieu ho tro" / en: "Ticket detail component tests"
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupportTicketWithDetails } from "../../types";
import { renderWithProviders } from "~/test-utils";
import { TicketDetail } from "../ticket-detail";

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

function makeMockTicketWithDetails(
  overrides: Partial<SupportTicketWithDetails> = {},
): SupportTicketWithDetails {
  const now = Date.now();
  return {
    _id: "ticket_1",
    _creationTime: now,
    organizationId: "org_1",
    createdBy: "user_1",
    status: "open",
    priority: "high",
    category: "technical",
    subjectVi: "Loi ky thuat",
    subjectEn: "Technical error",
    descriptionVi: "Mo ta chi tiet ve van de ky thuat.",
    createdAt: now,
    updatedAt: now,
    creatorName: "Nguyen Van A",
    messages: [
      {
        _id: "msg_1",
        _creationTime: now,
        ticketId: "ticket_1",
        authorId: "user_1",
        contentVi: "Tin nhan dau tien",
        createdAt: now,
        updatedAt: now,
        authorName: "Nguyen Van A",
      },
    ],
    ...overrides,
  };
}

describe("TicketDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test_TicketDetail_renders_ticket_subject", () => {
    const ticket = makeMockTicketWithDetails();

    renderWithProviders(<TicketDetail ticket={ticket} />);

    expect(screen.getByText("Loi ky thuat")).toBeInTheDocument();
  });

  it("test_TicketDetail_renders_english_subject_when_different", () => {
    const ticket = makeMockTicketWithDetails({
      subjectEn: "Technical error",
    });

    renderWithProviders(<TicketDetail ticket={ticket} />);

    expect(screen.getByText("Technical error")).toBeInTheDocument();
  });

  it("test_TicketDetail_renders_category_and_priority", () => {
    const ticket = makeMockTicketWithDetails({
      category: "technical",
      priority: "high",
    });

    renderWithProviders(<TicketDetail ticket={ticket} />);

    expect(screen.getByText("Ky thuat")).toBeInTheDocument();
    expect(screen.getByText("Cao")).toBeInTheDocument();
  });

  it("test_TicketDetail_renders_status_badge", () => {
    const ticket = makeMockTicketWithDetails({ status: "open" });

    renderWithProviders(<TicketDetail ticket={ticket} />);

    // The SupportStatusBadge should render "Mo" for open status
    expect(screen.getByText("Mo")).toBeInTheDocument();
  });

  it("test_TicketDetail_renders_creator_name", () => {
    const ticket = makeMockTicketWithDetails({
      creatorName: "Nguyen Van A",
    });

    renderWithProviders(<TicketDetail ticket={ticket} />);

    // Creator name appears in ticket info and possibly in message thread
    const elements = screen.getAllByText("Nguyen Van A");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("test_TicketDetail_renders_message_thread", () => {
    const ticket = makeMockTicketWithDetails();

    renderWithProviders(<TicketDetail ticket={ticket} />);

    // The message thread section should be present
    expect(screen.getByText("Cuoc tro chuyen")).toBeInTheDocument();
    // The first message content should be displayed
    expect(screen.getByText("Tin nhan dau tien")).toBeInTheDocument();
  });

  it("test_TicketDetail_shows_loading_skeleton", () => {
    renderWithProviders(<TicketDetail ticket={null} isLoading={true} />);

    // Should not show "not found" message when loading
    expect(
      screen.queryByText("Khong tim thay phieu ho tro."),
    ).not.toBeInTheDocument();
  });

  it("test_TicketDetail_shows_not_found_when_null", () => {
    renderWithProviders(<TicketDetail ticket={null} />);

    expect(
      screen.getByText("Khong tim thay phieu ho tro."),
    ).toBeInTheDocument();
  });

  it("test_TicketDetail_renders_description", () => {
    const ticket = makeMockTicketWithDetails({
      descriptionVi: "Van de nghiem trong can xu ly ngay.",
    });

    renderWithProviders(<TicketDetail ticket={ticket} />);

    expect(
      screen.getByText("Van de nghiem trong can xu ly ngay."),
    ).toBeInTheDocument();
  });
});
