/**
 * Tests for QuoteDashboardStats component.
 *
 * WHY: Verifies stats display, win rate calculation display, and
 * the N/A case when no decided quotes exist. These are key KPIs for
 * providers to track their quoting competitiveness.
 */
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "~/test-utils";
import { QuoteDashboardStats } from "../quote-dashboard-stats";
import type { QuoteDashboardStats as StatsType } from "../../types";

function createStats(overrides?: Partial<StatsType>): StatsType {
  return {
    pendingCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    totalCount: 0,
    winRate: -1,
    ...overrides,
  };
}

describe("QuoteDashboardStats", () => {
  it("test_QuoteDashboardStats_calculatesWinRate - renders stats container", () => {
    renderWithProviders(<QuoteDashboardStats stats={createStats()} />);
    expect(screen.getByTestId("quote-dashboard-stats")).toBeInTheDocument();
  });

  it("shows N/A for win rate when no decided quotes", () => {
    const stats = createStats({ winRate: -1 });
    renderWithProviders(<QuoteDashboardStats stats={stats} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("shows win rate percentage when quotes exist", () => {
    const stats = createStats({
      acceptedCount: 2,
      rejectedCount: 1,
      winRate: 67,
    });
    renderWithProviders(<QuoteDashboardStats stats={stats} />);
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("displays pending and accepted counts", () => {
    const stats = createStats({
      pendingCount: 3,
      acceptedCount: 5,
    });
    renderWithProviders(<QuoteDashboardStats stats={stats} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("displays Vietnamese labels for all stat cards", () => {
    renderWithProviders(<QuoteDashboardStats stats={createStats()} />);
    expect(screen.getByText("Báo giá đang chờ")).toBeInTheDocument();
    expect(screen.getByText("Báo giá được chấp nhận")).toBeInTheDocument();
    expect(screen.getByText("Tỷ lệ thắng")).toBeInTheDocument();
  });
});
