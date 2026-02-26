/**
 * Tests for SuspendedPage component.
 *
 * WHY: Verifies the suspended account page renders bilingual text
 * and contact support CTA.
 *
 * vi: "Kiem tra thanh phan SuspendedPage"
 * en: "Tests for SuspendedPage component"
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SuspendedPage } from "../components/suspended-page";

describe("SuspendedPage", () => {
  // AC7: SuspendedPage renders for suspended orgs

  it("renders bilingual title", () => {
    render(<SuspendedPage />);
    expect(screen.getByText(/Tai khoan tam ngung/)).toBeInTheDocument();
    expect(screen.getByText(/Account Suspended/)).toBeInTheDocument();
  });

  it("renders bilingual description", () => {
    render(<SuspendedPage />);
    expect(screen.getByText(/tam ngung boi quan tri vien/)).toBeInTheDocument();
    expect(
      screen.getByText(/suspended by the system administrator/),
    ).toBeInTheDocument();
  });

  it("renders contact support CTA", () => {
    render(<SuspendedPage />);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText(/Lien he ho tro/)).toBeInTheDocument();
    expect(screen.getByText(/Contact Support/)).toBeInTheDocument();
  });

  it("centers content on page", () => {
    const { container } = render(<SuspendedPage />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("items-center");
    expect(wrapper.className).toContain("justify-center");
    expect(wrapper.className).toContain("min-h-screen");
  });
});
