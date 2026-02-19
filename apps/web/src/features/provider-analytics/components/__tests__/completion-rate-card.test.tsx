/**
 * Tests for CompletionRateCard component.
 *
 * WHY: Verifies the card correctly renders completion rate as a percentage,
 * handles zero rate, and displays bilingual labels.
 *
 * vi: "Kiểm tra thẻ tỷ lệ hoàn thành" / en: "Completion rate card tests"
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { CompletionRateCard } from "../completion-rate-card";

describe("CompletionRateCard", () => {
  it("test_CompletionRateCard_rendersCompletionPercentage", () => {
    renderWithProviders(
      <CompletionRateCard
        completionRate={0.85}
        completedServices={17}
        totalServices={20}
        isLoading={false}
      />,
    );

    // 85% should be displayed
    expect(screen.getByText(/85/)).toBeInTheDocument();
  });

  it("test_CompletionRateCard_rendersZeroForNoData", () => {
    renderWithProviders(
      <CompletionRateCard
        completionRate={0}
        completedServices={0}
        totalServices={0}
        isLoading={false}
      />,
    );

    // 0% should be displayed as the main title
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it("test_CompletionRateCard_showsLoadingSkeleton", () => {
    renderWithProviders(
      <CompletionRateCard
        completionRate={0}
        completedServices={0}
        totalServices={0}
        isLoading={true}
      />,
    );

    // When loading, a skeleton/placeholder should be present
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).not.toBeNull();
  });

  it("test_CompletionRateCard_rendersVietnameseTitle", () => {
    renderWithProviders(
      <CompletionRateCard
        completionRate={0.9}
        completedServices={9}
        totalServices={10}
        isLoading={false}
      />,
    );

    // Vietnamese label for "Completion rate"
    expect(screen.getByText(/Tỷ lệ hoàn thành/)).toBeInTheDocument();
  });
});
