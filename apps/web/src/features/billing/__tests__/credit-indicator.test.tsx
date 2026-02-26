/**
 * Tests for CreditIndicator (navbar compact) component.
 *
 * WHY: Verifies the compact navbar indicator shows the total available
 * credits with color coding and tooltip with usage details.
 *
 * vi: "Kiem tra chi bao credit tren thanh dieu huong"
 * en: "Tests for CreditIndicator navbar component"
 */
import { render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreditIndicator } from "../components/credit-indicator";

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
  balance: 150,
  bonusCredits: 10,
  totalAvailable: 160,
  monthlyIncluded: 200,
  monthlyUsed: 50,
  monthlyResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  lifetimeCreditsGranted: 400,
  lifetimeCreditsUsed: 240,
};

describe("CreditIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC3: CreditIndicator in navbar shows compact balance with color coding

  it("returns null when credits data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);
    const { container } = render(
      <CreditIndicator organizationId={"org_123" as never} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("displays total available credits", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(<CreditIndicator organizationId={"org_123" as never} />);
    expect(screen.getByText("160")).toBeInTheDocument();
  });

  it("renders without errors when credits loaded", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    const { container } = render(
      <CreditIndicator organizationId={"org_123" as never} />,
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("shows healthy color for >50% remaining", () => {
    // 150/200 = 75% remaining -> healthy -> emerald
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(<CreditIndicator organizationId={"org_123" as never} />);
    const indicator = screen.getByTestId("credit-indicator");
    expect(indicator.className).toContain("emerald");
  });

  it("shows warning color for 20-50% remaining", () => {
    mockUseQuery.mockReturnValue({
      ...mockCredits,
      balance: 60,
      totalAvailable: 70,
      monthlyUsed: 140,
    } as ReturnType<typeof useQuery>);
    render(<CreditIndicator organizationId={"org_123" as never} />);
    const indicator = screen.getByTestId("credit-indicator");
    expect(indicator.className).toContain("amber");
  });

  it("shows critical color for <20% remaining", () => {
    mockUseQuery.mockReturnValue({
      ...mockCredits,
      balance: 10,
      totalAvailable: 10,
      monthlyUsed: 190,
    } as ReturnType<typeof useQuery>);
    render(<CreditIndicator organizationId={"org_123" as never} />);
    const indicator = screen.getByTestId("credit-indicator");
    expect(indicator.className).toContain("red");
  });
});
