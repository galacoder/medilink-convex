/**
 * Tests for CompletionReportForm component.
 *
 * WHY: The completion report form captures structured data for M3-4 analytics.
 * It must enforce minimum description length, handle optional parts list,
 * and surface validation errors bilingually. Provider staff fill this out
 * on-site after completing equipment service.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { CompletionReportForm } from "../completion-report-form";

describe("CompletionReportForm", () => {
  it("test_CompletionReportForm_rendersWithTestId - renders form with testid", () => {
    renderWithProviders(
      <CompletionReportForm
        serviceRequestId="sr_test_001"
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    );
    expect(screen.getByTestId("completion-report-form")).toBeInTheDocument();
  });

  it("renders Vietnamese label for work description field", () => {
    renderWithProviders(
      <CompletionReportForm
        serviceRequestId="sr_test_001"
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    );
    // Label text includes " *" suffix for required field indicator,
    // so use substring matching to find the Vietnamese label text
    expect(
      screen.getByText(/Mô tả công việc đã thực hiện/),
    ).toBeInTheDocument();
  });

  it("renders actual hours field", () => {
    renderWithProviders(
      <CompletionReportForm
        serviceRequestId="sr_test_001"
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    );
    expect(screen.getByTestId("actual-hours-input")).toBeInTheDocument();
  });

  it("renders next maintenance recommendation field", () => {
    renderWithProviders(
      <CompletionReportForm
        serviceRequestId="sr_test_001"
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    );
    expect(
      screen.getByTestId("maintenance-recommendation-input"),
    ).toBeInTheDocument();
  });

  it("shows submit button as disabled when isSubmitting is true", () => {
    renderWithProviders(
      <CompletionReportForm
        serviceRequestId="sr_test_001"
        onSubmit={vi.fn()}
        isSubmitting={true}
      />,
    );
    const submitBtn = screen.getByTestId("submit-report-btn");
    expect(submitBtn).toBeDisabled();
  });
});
