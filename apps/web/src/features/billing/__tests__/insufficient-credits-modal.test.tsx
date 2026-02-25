/**
 * Tests for InsufficientCreditsModal component.
 *
 * WHY: Verifies the modal displays current balance, required amount,
 * deficit, bilingual text, and contact CTA when credits are insufficient.
 *
 * vi: "Kiem tra modal khong du credit"
 * en: "Tests for InsufficientCreditsModal"
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InsufficientCreditsModal } from "../components/insufficient-credits-modal";

describe("InsufficientCreditsModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    required: 10,
    available: 3,
    featureLabel: "Generate Report",
    featureLabelVi: "Tao bao cao",
  };

  // AC7: Modal shows current balance, required amount, and deficit

  it("shows the required credit amount", () => {
    render(<InsufficientCreditsModal {...defaultProps} />);
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it("shows the available credit amount", () => {
    render(<InsufficientCreditsModal {...defaultProps} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows the deficit (required - available)", () => {
    render(<InsufficientCreditsModal {...defaultProps} />);
    // 10 - 3 = 7
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  // AC12: Bilingual text

  it("shows bilingual title", () => {
    render(<InsufficientCreditsModal {...defaultProps} />);
    expect(screen.getByText(/Khong du credit AI/)).toBeInTheDocument();
    expect(screen.getByText(/Insufficient AI Credits/)).toBeInTheDocument();
  });

  it("shows feature labels in both languages", () => {
    render(<InsufficientCreditsModal {...defaultProps} />);
    expect(screen.getByText(/Tao bao cao/)).toBeInTheDocument();
    expect(screen.getByText(/Generate Report/)).toBeInTheDocument();
  });

  // AC8: Modal provides "Contact Administrator" CTA

  it("shows contact administrator CTA", () => {
    render(<InsufficientCreditsModal {...defaultProps} />);
    expect(screen.getByText(/Lien he quan tri vien/)).toBeInTheDocument();
    expect(screen.getByText(/Contact Administrator/)).toBeInTheDocument();
  });

  it("shows close button with bilingual text", () => {
    render(<InsufficientCreditsModal {...defaultProps} />);
    expect(screen.getByText(/Dong \/ Close/)).toBeInTheDocument();
  });

  it("shows monthly reset information", () => {
    render(<InsufficientCreditsModal {...defaultProps} />);
    expect(screen.getByText(/ngay 1 moi thang/)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <InsufficientCreditsModal {...defaultProps} open={false} />,
    );
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });
});
