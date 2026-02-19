/**
 * Tests for ServiceRatingForm component.
 *
 * WHY: Verifies star rating interaction, sub-rating fields, and submit callback.
 * Critical for AC-06 (rate completed service: 1-5 stars with optional comment).
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { ServiceRatingForm } from "../service-rating-form";

describe("ServiceRatingForm", () => {
  it("test_ServiceRatingForm_rendersStarInput", () => {
    renderWithProviders(<ServiceRatingForm onSubmit={vi.fn()} />);

    // 5 star buttons should be visible
    const stars = screen.getAllByRole("button", { name: /sao/ });
    expect(stars).toHaveLength(5);
  });

  it("test_ServiceRatingForm_submitsRating", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<ServiceRatingForm onSubmit={onSubmit} />);

    // Click 4th star
    const stars = screen.getAllByRole("button", { name: /sao/ });
    const star4 = stars[3];
    if (!star4) throw new Error("Expected at least 4 star buttons");
    await user.click(star4); // 4 stars

    // Submit
    await user.click(screen.getByRole("button", { name: /Gửi đánh giá/ }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 4 }),
      );
    });
  });

  it("test_ServiceRatingForm_showsSubRatings", () => {
    renderWithProviders(<ServiceRatingForm onSubmit={vi.fn()} />);

    // Sub-rating fields should be visible
    expect(screen.getByText(/Chất lượng dịch vụ/)).toBeInTheDocument();
    expect(screen.getByText(/Đúng giờ/)).toBeInTheDocument();
    expect(screen.getByText(/Chuyên nghiệp/)).toBeInTheDocument();
  });

  it("test_ServiceRatingForm_validatesMinimum1Star", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(<ServiceRatingForm onSubmit={onSubmit} />);

    // Try to submit without selecting any stars
    await user.click(screen.getByRole("button", { name: /Gửi đánh giá/ }));

    // Should show validation error
    await waitFor(() => {
      expect(
        screen.getByText(/Vui lòng chọn ít nhất 1 sao/),
      ).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
