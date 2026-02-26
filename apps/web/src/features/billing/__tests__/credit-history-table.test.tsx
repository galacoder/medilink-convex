/**
 * Tests for CreditHistoryTable component.
 *
 * WHY: Verifies the consumption history table displays records with
 * user name, feature label, credits, status badges, and refund styling.
 *
 * vi: "Kiem tra bang lich su credit"
 * en: "Tests for CreditHistoryTable"
 */
import { render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreditHistoryTable } from "../components/credit-history-table";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@medilink/backend", () => ({
  api: {
    billing: {
      credits_queries: {
        getCreditConsumptionHistory:
          "billing/credits_queries:getCreditConsumptionHistory",
      },
    },
  },
}));

const mockUseQuery = vi.mocked(useQuery);

const mockHistory = [
  {
    _id: "consumption_1",
    _creationTime: Date.now(),
    organizationId: "org_123",
    userId: "user_1",
    userName: "Lan Tran",
    featureId: "equipment_diagnosis",
    creditsUsed: 5,
    status: "completed",
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    _id: "consumption_2",
    _creationTime: Date.now(),
    organizationId: "org_123",
    userId: "user_2",
    userName: "Duc Pham",
    featureId: "report_generation",
    creditsUsed: 10,
    status: "refunded",
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    _id: "consumption_3",
    _creationTime: Date.now(),
    organizationId: "org_123",
    userId: "user_1",
    userName: "Lan Tran",
    featureId: "manual_search",
    creditsUsed: 1,
    status: "pending",
    createdAt: Date.now() - 1000 * 60 * 30,
  },
];

describe("CreditHistoryTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC14: Loading skeletons shown while data fetches

  it("shows loading skeleton when data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);
    render(<CreditHistoryTable organizationId={"org_123" as never} />);
    expect(screen.getByTestId("credit-history-skeleton")).toBeInTheDocument();
  });

  // AC9: CreditHistoryTable shows consumption audit log

  it("shows table headers in bilingual format", () => {
    mockUseQuery.mockReturnValue(mockHistory as ReturnType<typeof useQuery>);
    render(<CreditHistoryTable organizationId={"org_123" as never} />);
    expect(screen.getByText(/Thoi gian/)).toBeInTheDocument();
    expect(screen.getByText(/Time/)).toBeInTheDocument();
    expect(screen.getByText(/Nguoi dung/)).toBeInTheDocument();
    expect(screen.getByText(/User/)).toBeInTheDocument();
    expect(screen.getByText(/Tinh nang/)).toBeInTheDocument();
    expect(screen.getByText(/Feature/)).toBeInTheDocument();
  });

  it("shows user names", () => {
    mockUseQuery.mockReturnValue(mockHistory as ReturnType<typeof useQuery>);
    render(<CreditHistoryTable organizationId={"org_123" as never} />);
    // "Lan Tran" appears twice (2 records from same user)
    const lanElements = screen.getAllByText("Lan Tran");
    expect(lanElements.length).toBe(2);
    expect(screen.getByText("Duc Pham")).toBeInTheDocument();
  });

  it("shows credit amounts", () => {
    mockUseQuery.mockReturnValue(mockHistory as ReturnType<typeof useQuery>);
    render(<CreditHistoryTable organizationId={"org_123" as never} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  // AC10: Refunded records show strikethrough on credit amount

  it("shows strikethrough on refunded credit amount", () => {
    mockUseQuery.mockReturnValue(mockHistory as ReturnType<typeof useQuery>);
    render(<CreditHistoryTable organizationId={"org_123" as never} />);
    // The "10" credit for refunded record should have line-through class
    const refundedRow = screen.getByText("10").closest("span");
    expect(refundedRow).toHaveClass("line-through");
  });

  it("shows refunded badge for refunded records", () => {
    mockUseQuery.mockReturnValue(mockHistory as ReturnType<typeof useQuery>);
    render(<CreditHistoryTable organizationId={"org_123" as never} />);
    // "Hoan tra / Refunded" appears in both inline badge and status badge
    const refundedElements = screen.getAllByText(/Hoan tra/);
    expect(refundedElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state when no records", () => {
    mockUseQuery.mockReturnValue([] as ReturnType<typeof useQuery>);
    render(<CreditHistoryTable organizationId={"org_123" as never} />);
    expect(screen.getByText(/Chua co lich su/)).toBeInTheDocument();
  });
});
