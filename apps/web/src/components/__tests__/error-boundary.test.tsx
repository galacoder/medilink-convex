/**
 * Tests for the bilingual error boundary component.
 *
 * WHY: Error boundaries are the last line of defense before an unhandled error
 * crashes the entire application. Tests verify that the fallback UI renders
 * correctly with bilingual (Vietnamese primary, English secondary) content,
 * and that the reset callback is wired up to the "Try again" button.
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { ErrorFallback } from "../error-boundary";

describe("ErrorFallback", () => {
  it("renders Vietnamese primary error heading", () => {
    const error = new Error("Test error");
    const reset = vi.fn();
    renderWithProviders(<ErrorFallback error={error} reset={reset} />);

    // Vietnamese primary heading
    expect(screen.getByText(/Đã xảy ra lỗi/i)).toBeInTheDocument();
  });

  it("renders English secondary error heading", () => {
    const error = new Error("Test error");
    const reset = vi.fn();
    renderWithProviders(<ErrorFallback error={error} reset={reset} />);

    // English secondary heading
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it("renders a retry button with bilingual label", () => {
    const error = new Error("Test error");
    const reset = vi.fn();
    renderWithProviders(<ErrorFallback error={error} reset={reset} />);

    // Button must have both Thử lại (vi) and Try again (en)
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button.textContent).toMatch(/Thử lại/);
    expect(button.textContent).toMatch(/Try again/);
  });

  it("calls reset when retry button is clicked", () => {
    const error = new Error("Test error");
    const reset = vi.fn();
    renderWithProviders(<ErrorFallback error={error} reset={reset} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(reset).toHaveBeenCalledOnce();
  });

  it("has data-testid for monitoring and E2E tests", () => {
    const error = new Error("Test error");
    const reset = vi.fn();
    renderWithProviders(<ErrorFallback error={error} reset={reset} />);

    expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
  });

  it("does not expose raw error message to user in production", () => {
    // Error messages may contain sensitive server information
    const error = new Error(
      "Database connection string: postgres://secret@host",
    );
    const reset = vi.fn();
    renderWithProviders(<ErrorFallback error={error} reset={reset} />);

    // The raw technical error message should not be directly rendered
    expect(
      screen.queryByText("Database connection string: postgres://secret@host"),
    ).not.toBeInTheDocument();
  });
});
