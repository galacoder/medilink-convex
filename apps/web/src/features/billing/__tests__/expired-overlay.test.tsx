/**
 * Tests for ExpiredOverlay component.
 *
 * WHY: Verifies the full-page overlay renders with bilingual text,
 * contact CTAs, and proper blocking z-index when org is expired.
 *
 * vi: "Kiem tra thanh phan ExpiredOverlay"
 * en: "Tests for ExpiredOverlay component"
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExpiredOverlay } from "../components/expired-overlay";

describe("ExpiredOverlay", () => {
  // AC5: ExpiredOverlay blocks all interaction when org is expired

  it("renders fixed overlay covering viewport", () => {
    const { container } = render(<ExpiredOverlay />);
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.className).toContain("fixed");
    expect(overlay.className).toContain("inset-0");
    expect(overlay.className).toContain("z-50");
  });

  // AC6: ExpiredOverlay shows bilingual contact CTA

  it("renders bilingual title", () => {
    render(<ExpiredOverlay />);
    expect(screen.getByText(/Dang ky da het han/)).toBeInTheDocument();
    expect(screen.getByText(/Subscription Expired/)).toBeInTheDocument();
  });

  it("renders bilingual description", () => {
    render(<ExpiredOverlay />);
    expect(
      screen.getByText(/Thoi gian gia han da ket thuc/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Your grace period has ended/)).toBeInTheDocument();
  });

  it("renders contact CTA buttons", () => {
    render(<ExpiredOverlay />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Lien he MediLink/)).toBeInTheDocument();
    expect(screen.getByText(/Gui yeu cau gia han/)).toBeInTheDocument();
  });

  it("renders hotline and email info", () => {
    render(<ExpiredOverlay />);
    expect(screen.getByText(/1900-xxxx/)).toBeInTheDocument();
    expect(screen.getByText(/billing@medilink.vn/)).toBeInTheDocument();
  });

  it("has no close button (cannot be dismissed)", () => {
    render(<ExpiredOverlay />);
    // Should not have any close/dismiss/x button
    const closeButtons = screen.queryAllByRole("button");
    closeButtons.forEach((btn) => {
      expect(btn.textContent).not.toMatch(/^[xX]$/);
      const ariaLabel = btn.getAttribute("aria-label") ?? "";
      expect(ariaLabel).not.toMatch(/close|dismiss/i);
    });
  });
});
