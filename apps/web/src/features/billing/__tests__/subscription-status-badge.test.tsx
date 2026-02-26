/**
 * Tests for SubscriptionStatusBadge component.
 *
 * WHY: Verifies correct badge rendering for all 5 subscription statuses,
 * bilingual labels, and days remaining display for trial/grace_period.
 *
 * vi: "Kiem tra thanh phan SubscriptionStatusBadge"
 * en: "Tests for SubscriptionStatusBadge component"
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubscriptionStatusBadge } from "../components/subscription-status-badge";

describe("SubscriptionStatusBadge", () => {
  // AC1: SubscriptionStatusBadge renders correctly for all 5 statuses

  it("renders active status badge", () => {
    render(<SubscriptionStatusBadge status="active" />);
    // Bilingual: Vietnamese / English
    expect(screen.getByText(/Hoat dong/)).toBeInTheDocument();
    expect(screen.getByText(/Active/)).toBeInTheDocument();
  });

  it("renders trial status badge", () => {
    render(<SubscriptionStatusBadge status="trial" daysRemaining={7} />);
    expect(screen.getByText(/Dung thu/)).toBeInTheDocument();
    expect(screen.getByText(/Trial/)).toBeInTheDocument();
  });

  it("renders grace_period status badge", () => {
    render(<SubscriptionStatusBadge status="grace_period" daysRemaining={3} />);
    expect(screen.getByText(/Gia han/)).toBeInTheDocument();
    expect(screen.getByText(/Grace Period/)).toBeInTheDocument();
  });

  it("renders expired status badge", () => {
    render(<SubscriptionStatusBadge status="expired" />);
    expect(screen.getByText(/Het han/)).toBeInTheDocument();
    expect(screen.getByText(/Expired/)).toBeInTheDocument();
  });

  it("renders suspended status badge", () => {
    render(<SubscriptionStatusBadge status="suspended" />);
    expect(screen.getByText(/Tam ngung/)).toBeInTheDocument();
    expect(screen.getByText(/Suspended/)).toBeInTheDocument();
  });

  // AC2: Badge shows days remaining for trial and grace_period

  it("shows days remaining for trial status", () => {
    render(<SubscriptionStatusBadge status="trial" daysRemaining={5} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("shows days remaining for grace_period status", () => {
    render(<SubscriptionStatusBadge status="grace_period" daysRemaining={2} />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it("does not show days remaining for active status", () => {
    const { container } = render(<SubscriptionStatusBadge status="active" />);
    // Should not contain "days" text
    expect(container.textContent).not.toContain("days left");
    expect(container.textContent).not.toContain("con");
  });

  // AC13: All text is bilingual

  it("all 5 statuses render without errors", () => {
    const statuses = [
      "active",
      "trial",
      "grace_period",
      "expired",
      "suspended",
    ] as const;
    statuses.forEach((status) => {
      const { unmount } = render(
        <SubscriptionStatusBadge status={status} daysRemaining={5} />,
      );
      unmount();
    });
  });
});
