/**
 * Tests for TrialBanner component.
 *
 * WHY: Verifies the trial banner only renders when less than 7 days
 * remain, shows bilingual text, and includes upgrade CTA.
 *
 * vi: "Kiem tra thanh phan TrialBanner"
 * en: "Tests for TrialBanner component"
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrialBanner } from "../components/trial-banner";

describe("TrialBanner", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  // AC11: TrialBanner only shows when <7 days remain in trial

  it("returns null when more than 7 days remain", () => {
    const expiresAt = Date.now() + 10 * DAY_MS;
    const { container } = render(<TrialBanner expiresAt={expiresAt} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when exactly 7 days remain", () => {
    const expiresAt = Date.now() + 7 * DAY_MS;
    render(<TrialBanner expiresAt={expiresAt} />);
    expect(screen.getByText(/7/)).toBeInTheDocument();
  });

  it("renders when 3 days remain", () => {
    const expiresAt = Date.now() + 3 * DAY_MS;
    render(<TrialBanner expiresAt={expiresAt} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("renders when 1 day remains", () => {
    const expiresAt = Date.now() + 1 * DAY_MS;
    render(<TrialBanner expiresAt={expiresAt} />);
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  // AC13: Bilingual text

  it("shows bilingual trial remaining text", () => {
    const expiresAt = Date.now() + 5 * DAY_MS;
    render(<TrialBanner expiresAt={expiresAt} />);
    // Vietnamese
    expect(screen.getByText(/Dung thu con/)).toBeInTheDocument();
    // English
    expect(screen.getByText(/days left in your trial/)).toBeInTheDocument();
  });

  it("shows upgrade CTA button", () => {
    const expiresAt = Date.now() + 5 * DAY_MS;
    render(<TrialBanner expiresAt={expiresAt} />);
    expect(screen.getByText(/Nang cap ngay/)).toBeInTheDocument();
    expect(screen.getByText(/Upgrade now/)).toBeInTheDocument();
  });
});
