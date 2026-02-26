/**
 * Tests for AiActionButton component.
 *
 * WHY: Verifies AI action buttons display the credit cost badge,
 * show correct cost per feature, and open the insufficient credits modal
 * when the user lacks enough credits.
 *
 * vi: "Kiem tra nut hanh dong AI"
 * en: "Tests for AiActionButton"
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiActionButton } from "../components/ai-action-button";

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
  balance: 100,
  bonusCredits: 0,
  totalAvailable: 100,
  monthlyIncluded: 200,
  monthlyUsed: 100,
  monthlyResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  lifetimeCreditsGranted: 200,
  lifetimeCreditsUsed: 100,
};

describe("AiActionButton", () => {
  const handleClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC4: AiActionButton displays credit cost on every AI action button

  it("displays credit cost badge for equipment_diagnosis (5 credits)", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(
      <AiActionButton
        featureId="equipment_diagnosis"
        onClick={handleClick}
        organizationId={"org_123" as never}
      >
        Chan doan / Diagnose
      </AiActionButton>,
    );
    expect(screen.getByText(/5 credits/)).toBeInTheDocument();
  });

  // AC5: AI buttons show correct cost
  it("displays correct cost for report_generation (10 credits)", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(
      <AiActionButton
        featureId="report_generation"
        onClick={handleClick}
        organizationId={"org_123" as never}
      >
        Tao bao cao / Generate Report
      </AiActionButton>,
    );
    expect(screen.getByText(/10 credits/)).toBeInTheDocument();
  });

  it("displays correct cost for manual_search (1 credit)", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(
      <AiActionButton
        featureId="manual_search"
        onClick={handleClick}
        organizationId={"org_123" as never}
      >
        Tim kiem AI / AI Search
      </AiActionButton>,
    );
    expect(screen.getByText(/1 credit/)).toBeInTheDocument();
  });

  it("displays correct cost for maintenance_prediction (3 credits)", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(
      <AiActionButton
        featureId="maintenance_prediction"
        onClick={handleClick}
        organizationId={"org_123" as never}
      >
        Du doan bao tri
      </AiActionButton>,
    );
    expect(screen.getByText(/3 credits/)).toBeInTheDocument();
  });

  it("displays correct cost for training_material (8 credits)", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(
      <AiActionButton
        featureId="training_material"
        onClick={handleClick}
        organizationId={"org_123" as never}
      >
        Tao tai lieu dao tao
      </AiActionButton>,
    );
    expect(screen.getByText(/8 credits/)).toBeInTheDocument();
  });

  it("displays correct cost for inventory_optimization (15 credits)", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(
      <AiActionButton
        featureId="inventory_optimization"
        onClick={handleClick}
        organizationId={"org_123" as never}
      >
        Toi uu ton kho
      </AiActionButton>,
    );
    expect(screen.getByText(/15 credits/)).toBeInTheDocument();
  });

  // Calls onClick when enough credits

  it("calls onClick when user has enough credits", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(
      <AiActionButton
        featureId="equipment_diagnosis"
        onClick={handleClick}
        organizationId={"org_123" as never}
      >
        Diagnose
      </AiActionButton>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // AC6: Clicking AI button with insufficient credits opens InsufficientCreditsModal

  it("opens insufficient credits modal when not enough credits", () => {
    mockUseQuery.mockReturnValue({
      ...mockCredits,
      balance: 2,
      totalAvailable: 2,
    } as ReturnType<typeof useQuery>);
    render(
      <AiActionButton
        featureId="equipment_diagnosis"
        onClick={handleClick}
        organizationId={"org_123" as never}
      >
        Diagnose
      </AiActionButton>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
    // Modal should now be visible
    expect(screen.getByText(/Khong du credit AI/)).toBeInTheDocument();
  });

  it("is disabled when credits data is loading", () => {
    mockUseQuery.mockReturnValue(undefined as ReturnType<typeof useQuery>);
    render(
      <AiActionButton
        featureId="equipment_diagnosis"
        onClick={handleClick}
        organizationId={"org_123" as never}
      >
        Diagnose
      </AiActionButton>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders children text", () => {
    mockUseQuery.mockReturnValue(mockCredits as ReturnType<typeof useQuery>);
    render(
      <AiActionButton
        featureId="equipment_diagnosis"
        onClick={handleClick}
        organizationId={"org_123" as never}
      >
        Chan doan thiet bi / Diagnose
      </AiActionButton>,
    );
    expect(screen.getByText(/Chan doan thiet bi/)).toBeInTheDocument();
  });
});
