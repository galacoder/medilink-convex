/**
 * Tests for OverviewStatsCards component.
 *
 * WHY: Verifies the overview cards correctly render platform statistics,
 * handle loading states, and display bilingual Vietnamese labels.
 *
 * vi: "Kiểm tra thẻ thống kê tổng quan" / en: "Overview stats cards tests"
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { OverviewStatsCards } from "../overview-stats-cards";

const mockStats = {
  totalHospitals: 12,
  totalProviders: 45,
  totalEquipment: 230,
  totalServiceRequests: 850,
  totalRevenue: 75_000_000,
};

describe("OverviewStatsCards", () => {
  it("test_OverviewStatsCards_rendersHospitalCount", () => {
    renderWithProviders(
      <OverviewStatsCards stats={mockStats} isLoading={false} />,
    );

    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("test_OverviewStatsCards_rendersProviderCount", () => {
    renderWithProviders(
      <OverviewStatsCards stats={mockStats} isLoading={false} />,
    );

    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("test_OverviewStatsCards_rendersEquipmentCount", () => {
    renderWithProviders(
      <OverviewStatsCards stats={mockStats} isLoading={false} />,
    );

    expect(screen.getByText("230")).toBeInTheDocument();
  });

  it("test_OverviewStatsCards_showsLoadingSkeletons", () => {
    renderWithProviders(<OverviewStatsCards stats={null} isLoading={true} />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("test_OverviewStatsCards_rendersVietnameseLabels", () => {
    renderWithProviders(
      <OverviewStatsCards stats={mockStats} isLoading={false} />,
    );

    // Vietnamese labels should be present
    expect(screen.getByText(/Tổng bệnh viện/)).toBeInTheDocument();
    expect(screen.getByText(/Tổng nhà cung cấp/)).toBeInTheDocument();
  });

  it("test_OverviewStatsCards_rendersZeroStatsWhenStatsNull", () => {
    renderWithProviders(<OverviewStatsCards stats={null} isLoading={false} />);

    // When stats is null, it should display 0 values
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });

  it("test_OverviewStatsCards_formatsRevenueAsVND", () => {
    renderWithProviders(
      <OverviewStatsCards stats={mockStats} isLoading={false} />,
    );

    // Revenue of 75,000,000 should show as "75Tr VND"
    expect(screen.getByText(/VND/)).toBeInTheDocument();
  });
});
