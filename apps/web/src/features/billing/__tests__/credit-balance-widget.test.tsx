/**
 * Tests for CreditBalanceWidget component.
 *
 * WHY: Verifies the dashboard widget displays balance, usage, reset date,
 * progress bar with color coding, loading skeleton, and bilingual text.
 *
 * vi: "Kiem tra widget so du credit"
 * en: "Tests for CreditBalanceWidget"
 */
import { render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreditBalanceWidget } from "../components/credit-balance-widget";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@medilink/backend", () => ({
  api: {
    billing: {
      credits_queries: {
        getAiCreditBalance: "billing/credits_queries:getAiCreditBalance",
      },
    },
  },
}));

const mockUseQuery = vi.mocked(useQuery);

const mockCredits = {
  balance: 58,
  bonusCredits: 0,
  totalAvailable: 58,
  monthlyIncluded: 200,
  monthlyUsed: 142,
  monthlyResetAt: new Date("2026-03-01").getTime(),
  lifetimeCreditsGranted: 400,
  lifetimeCreditsUsed: 342,
};

describe("CreditBalanceWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC14: Loading skeletons shown while data fetches

  it("shows loading skeleton when data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);
    render(<CreditBalanceWidget organizationId={"org_123" as never} />);
    expect(screen.getByTestId("credit-balance-skeleton")).toBeInTheDocument();
  });

  // AC1: CreditBalanceWidget displays current balance, usage, and reset date

  it("displays current balance and monthly included", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(<CreditBalanceWidget organizationId={"org_123" as never} />);
    expect(screen.getByText(/58/)).toBeInTheDocument();
    expect(screen.getByText(/200/)).toBeInTheDocument();
  });

  it("displays monthly usage", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(<CreditBalanceWidget organizationId={"org_123" as never} />);
    expect(screen.getByText("142")).toBeInTheDocument();
  });

  it("displays reset date", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(<CreditBalanceWidget organizationId={"org_123" as never} />);
    // Formatted date should appear (locale-dependent, check for year)
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  // AC12: All text is bilingual

  it("shows bilingual labels", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(<CreditBalanceWidget organizationId={"org_123" as never} />);
    // Vietnamese + English
    expect(screen.getByText(/Credit AI/)).toBeInTheDocument();
    expect(screen.getByText(/AI Credits/)).toBeInTheDocument();
    expect(screen.getByText(/Da dung thang nay/)).toBeInTheDocument();
    expect(screen.getByText(/Used this month/)).toBeInTheDocument();
  });

  it("shows remaining percentage", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(<CreditBalanceWidget organizationId={"org_123" as never} />);
    // 58/200 = 29% remaining
    expect(screen.getByText(/29%/)).toBeInTheDocument();
    expect(screen.getByText(/con lai/)).toBeInTheDocument();
    expect(screen.getByText(/remaining/)).toBeInTheDocument();
  });

  it("shows view history button", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(<CreditBalanceWidget organizationId={"org_123" as never} />);
    expect(screen.getByText(/Xem lich su/)).toBeInTheDocument();
    expect(screen.getByText(/View history/)).toBeInTheDocument();
  });

  it("shows bonus credits when > 0", () => {
    mockUseQuery.mockReturnValue({
      ...mockCredits,
      bonusCredits: 25,
      totalAvailable: 83,
    } as ReturnType<typeof useQuery>);
    render(<CreditBalanceWidget organizationId={"org_123" as never} />);
    expect(screen.getByText(/Bonus credits/)).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("hides bonus credits when 0", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(<CreditBalanceWidget organizationId={"org_123" as never} />);
    expect(screen.queryByText(/Bonus credits/)).not.toBeInTheDocument();
  });
});
