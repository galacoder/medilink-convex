/**
 * Tests for DeclineRequestDialog component.
 *
 * WHY: Declining a request is an important provider action with audit
 * implications. Tests verify: dialog renders when open, reason validation,
 * and submit button state based on reason length.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { DeclineRequestDialog } from "../decline-request-dialog";

// Mock convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue({ success: true })),
}));

describe("DeclineRequestDialog", () => {
  it("test_DeclineRequestDialog_requiresReason - submit is disabled when reason is empty", () => {
    renderWithProviders(
      <DeclineRequestDialog
        open={true}
        onOpenChange={vi.fn()}
        serviceRequestId="sr_test_001"
      />,
    );

    // Dialog should be open
    expect(screen.getByTestId("decline-request-dialog")).toBeInTheDocument();

    // Submit button should be disabled without a reason
    const confirmBtn = screen.getByTestId("decline-confirm-btn");
    expect(confirmBtn).toBeDisabled();
  });

  it("renders with testid when open", () => {
    renderWithProviders(
      <DeclineRequestDialog
        open={true}
        onOpenChange={vi.fn()}
        serviceRequestId="sr_test_001"
      />,
    );

    expect(screen.getByTestId("decline-request-dialog")).toBeInTheDocument();
  });

  it("shows the reason textarea", () => {
    renderWithProviders(
      <DeclineRequestDialog
        open={true}
        onOpenChange={vi.fn()}
        serviceRequestId="sr_test_001"
      />,
    );

    expect(screen.getByTestId("decline-reason-textarea")).toBeInTheDocument();
  });

  it("enables submit button when reason is long enough", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DeclineRequestDialog
        open={true}
        onOpenChange={vi.fn()}
        serviceRequestId="sr_test_001"
      />,
    );

    const textarea = screen.getByTestId("decline-reason-textarea");
    await user.type(
      textarea,
      "Yêu cầu không phù hợp với dịch vụ của chúng tôi",
    );

    const confirmBtn = screen.getByTestId("decline-confirm-btn");
    expect(confirmBtn).not.toBeDisabled();
  });

  it("shows validation message when reason is too short", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DeclineRequestDialog
        open={true}
        onOpenChange={vi.fn()}
        serviceRequestId="sr_test_001"
      />,
    );

    const textarea = screen.getByTestId("decline-reason-textarea");
    await user.type(textarea, "Ngắn");

    expect(screen.getByText(/ít nhất 10 ký tự/)).toBeInTheDocument();
  });

  it("shows Vietnamese title", () => {
    renderWithProviders(
      <DeclineRequestDialog
        open={true}
        onOpenChange={vi.fn()}
        serviceRequestId="sr_test_001"
      />,
    );

    expect(screen.getByText("Xác nhận từ chối yêu cầu")).toBeInTheDocument();
  });
});
