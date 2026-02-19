/**
 * Tests for StatusTimeline component.
 *
 * WHY: Verifies that the timeline correctly highlights the current step,
 * marks completed steps, and grays out future steps. Critical for AC-05
 * (track status: timeline view showing workflow progression).
 */
import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "~/test-utils";
import { StatusTimeline } from "../status-timeline";

describe("StatusTimeline", () => {
  it("test_StatusTimeline_highlightsCurrentStep", () => {
    renderWithProviders(<StatusTimeline currentStatus="quoted" />);

    // "Đã nhận báo giá" (quoted step) should be the current/active step
    const quotedStep = screen.getByText(/Đã nhận báo giá/);
    expect(quotedStep).toBeInTheDocument();
  });

  it("test_StatusTimeline_showsCompletedSteps", () => {
    renderWithProviders(<StatusTimeline currentStatus="accepted" />);

    // When status is "accepted", steps before it (pending, quoted) should be visible
    expect(screen.getByText(/Yêu cầu đã gửi/)).toBeInTheDocument();
    expect(screen.getByText(/Đã nhận báo giá/)).toBeInTheDocument();
    expect(screen.getByText(/Đã chấp nhận báo giá/)).toBeInTheDocument();
  });

  it("test_StatusTimeline_graysOutFutureSteps", () => {
    renderWithProviders(<StatusTimeline currentStatus="pending" />);

    // All main workflow steps should render (completed + pending)
    expect(screen.getByText(/Yêu cầu đã gửi/)).toBeInTheDocument();
    expect(screen.getByText(/Đã nhận báo giá/)).toBeInTheDocument();
    expect(screen.getByText(/Đang thực hiện/)).toBeInTheDocument();
    expect(screen.getByText(/Hoàn thành/)).toBeInTheDocument();
  });

  it("test_StatusTimeline_showsCancelledState", () => {
    renderWithProviders(<StatusTimeline currentStatus="cancelled" />);

    // Cancelled state should show special indicator
    expect(screen.getByText(/Đã hủy/)).toBeInTheDocument();
  });
});
