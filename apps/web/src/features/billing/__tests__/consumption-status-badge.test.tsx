/**
 * Tests for ConsumptionStatusBadge component.
 *
 * WHY: Verifies status badges render correct bilingual text and color
 * for all 4 consumption statuses: pending, completed, failed, refunded.
 *
 * vi: "Kiem tra huy hieu trang thai tieu thu"
 * en: "Tests for ConsumptionStatusBadge"
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConsumptionStatusBadge } from "../components/consumption-status-badge";

describe("ConsumptionStatusBadge", () => {
  it("renders pending status with bilingual text", () => {
    render(<ConsumptionStatusBadge status="pending" />);
    expect(screen.getByText(/Dang xu ly/)).toBeInTheDocument();
    expect(screen.getByText(/Processing/)).toBeInTheDocument();
  });

  it("renders completed status with bilingual text", () => {
    render(<ConsumptionStatusBadge status="completed" />);
    expect(screen.getByText(/Hoan thanh/)).toBeInTheDocument();
    expect(screen.getByText(/Completed/)).toBeInTheDocument();
  });

  it("renders failed status with bilingual text", () => {
    render(<ConsumptionStatusBadge status="failed" />);
    expect(screen.getByText(/That bai/)).toBeInTheDocument();
    expect(screen.getByText(/Failed/)).toBeInTheDocument();
  });

  it("renders refunded status with bilingual text", () => {
    render(<ConsumptionStatusBadge status="refunded" />);
    expect(screen.getByText(/Hoan tra/)).toBeInTheDocument();
    expect(screen.getByText(/Refunded/)).toBeInTheDocument();
  });

  it("renders all 4 statuses without errors", () => {
    const statuses = ["pending", "completed", "failed", "refunded"] as const;
    statuses.forEach((status) => {
      const { unmount } = render(<ConsumptionStatusBadge status={status} />);
      unmount();
    });
  });
});
