/**
 * Tests for GracePeriodBanner component.
 *
 * WHY: Verifies the banner renders bilingual text, countdown days,
 * sticky positioning, and contact CTA during grace period.
 *
 * vi: "Kiem tra thanh phan GracePeriodBanner"
 * en: "Tests for GracePeriodBanner component"
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GracePeriodBanner } from "../components/grace-period-banner";

describe("GracePeriodBanner", () => {
  const threeDaysFromNow = Date.now() + 3 * 24 * 60 * 60 * 1000;

  // AC3: GracePeriodBanner appears during grace period on all pages

  it("renders bilingual title text", () => {
    render(<GracePeriodBanner gracePeriodEndsAt={threeDaysFromNow} />);
    // Vietnamese primary
    expect(screen.getByText(/Dang ky da het han/)).toBeInTheDocument();
    // English secondary
    expect(
      screen.getByText(/Your subscription has expired/),
    ).toBeInTheDocument();
  });

  it("shows days remaining countdown", () => {
    render(<GracePeriodBanner gracePeriodEndsAt={threeDaysFromNow} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("renders contact CTA button", () => {
    render(<GracePeriodBanner gracePeriodEndsAt={threeDaysFromNow} />);
    // Bilingual CTA
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText(/Lien he gia han/)).toBeInTheDocument();
  });

  // AC4: GracePeriodBanner is sticky (does not scroll away)

  it("has sticky positioning class", () => {
    const { container } = render(
      <GracePeriodBanner gracePeriodEndsAt={threeDaysFromNow} />,
    );
    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toContain("sticky");
    expect(banner.className).toContain("top-0");
  });

  // AC13: Bilingual text

  it("shows bilingual description text", () => {
    render(<GracePeriodBanner gracePeriodEndsAt={threeDaysFromNow} />);
    expect(screen.getByText(/read-only access/i)).toBeInTheDocument();
  });

  it("handles 1 day remaining", () => {
    const oneDayFromNow = Date.now() + 1 * 24 * 60 * 60 * 1000;
    render(<GracePeriodBanner gracePeriodEndsAt={oneDayFromNow} />);
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });
});
