/**
 * Tests for NotificationItem component.
 *
 * WHY: Verifies that:
 * - Unread indicator dot is shown for unread notifications
 * - Bilingual labels are rendered correctly (vi/en)
 * - Type labels map correctly to display text
 * - Clicking an unread item calls onMarkRead with the notification ID
 * - Clicking a read item does NOT call onMarkRead
 *
 * vi: "Kiểm tra mục thông báo" / en: "Notification item tests"
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Doc } from "convex/_generated/dataModel";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { NotificationItem } from "../notification-item";

// ---------------------------------------------------------------------------
// Mock notification factory
// ---------------------------------------------------------------------------

function createMockNotification(
  overrides: Partial<Doc<"notifications">> = {},
): Doc<"notifications"> {
  const now = Date.now();
  return {
    _id: "notif_123" as Doc<"notifications">["_id"],
    _creationTime: now,
    userId: "user_456",
    type: "service_request_new_quote",
    titleVi: "Báo giá mới nhận được",
    titleEn: "New quote received",
    bodyVi: "Bạn có một báo giá mới cho yêu cầu dịch vụ.",
    bodyEn: "You have a new quote for your service request.",
    read: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Doc<"notifications">;
}

// ---------------------------------------------------------------------------
// NotificationItem tests
// ---------------------------------------------------------------------------

describe("NotificationItem", () => {
  it("test_NotificationItem_renders_vietnamese_title_by_default", () => {
    const notification = createMockNotification();
    const onMarkRead = vi.fn();

    renderWithProviders(
      <NotificationItem notification={notification} onMarkRead={onMarkRead} />,
    );

    expect(screen.getByText("Báo giá mới nhận được")).toBeInTheDocument();
  });

  it("test_NotificationItem_renders_english_title_when_locale_is_en", () => {
    const notification = createMockNotification();
    const onMarkRead = vi.fn();

    renderWithProviders(
      <NotificationItem
        notification={notification}
        onMarkRead={onMarkRead}
        locale="en"
      />,
    );

    expect(screen.getByText("New quote received")).toBeInTheDocument();
  });

  it("test_NotificationItem_shows_unread_indicator_for_unread_notification", () => {
    const notification = createMockNotification({ read: false });
    const onMarkRead = vi.fn();

    renderWithProviders(
      <NotificationItem notification={notification} onMarkRead={onMarkRead} />,
    );

    // The unread indicator is an aria-hidden blue dot
    // The button should indicate it's unread via aria-label
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining("chưa đọc"),
    );
  });

  it("test_NotificationItem_shows_read_label_for_read_notification", () => {
    const notification = createMockNotification({ read: true });
    const onMarkRead = vi.fn();

    renderWithProviders(
      <NotificationItem notification={notification} onMarkRead={onMarkRead} />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining("đã đọc"),
    );
  });

  it("test_NotificationItem_calls_onMarkRead_when_unread_item_clicked", async () => {
    const user = userEvent.setup();
    const notification = createMockNotification({
      _id: "notif_abc" as Doc<"notifications">["_id"],
      read: false,
    });
    const onMarkRead = vi.fn();

    renderWithProviders(
      <NotificationItem notification={notification} onMarkRead={onMarkRead} />,
    );

    await user.click(screen.getByRole("button"));
    expect(onMarkRead).toHaveBeenCalledWith("notif_abc");
  });

  it("test_NotificationItem_does_not_call_onMarkRead_when_read_item_clicked", async () => {
    const user = userEvent.setup();
    const notification = createMockNotification({ read: true });
    const onMarkRead = vi.fn();

    renderWithProviders(
      <NotificationItem notification={notification} onMarkRead={onMarkRead} />,
    );

    await user.click(screen.getByRole("button"));
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it("test_NotificationItem_renders_type_label_in_vietnamese", () => {
    const notification = createMockNotification({
      type: "equipment_maintenance_due",
    });
    const onMarkRead = vi.fn();

    renderWithProviders(
      <NotificationItem notification={notification} onMarkRead={onMarkRead} />,
    );

    expect(screen.getByText("Bảo trì đến hạn")).toBeInTheDocument();
  });

  it("test_NotificationItem_renders_type_label_in_english", () => {
    const notification = createMockNotification({
      type: "equipment_maintenance_due",
    });
    const onMarkRead = vi.fn();

    renderWithProviders(
      <NotificationItem
        notification={notification}
        onMarkRead={onMarkRead}
        locale="en"
      />,
    );

    expect(screen.getByText("Maintenance Due")).toBeInTheDocument();
  });

  it("test_NotificationItem_renders_body_text", () => {
    const notification = createMockNotification({
      bodyVi: "Nội dung thử nghiệm",
      bodyEn: "Test body content",
    });
    const onMarkRead = vi.fn();

    renderWithProviders(
      <NotificationItem notification={notification} onMarkRead={onMarkRead} />,
    );

    expect(screen.getByText("Nội dung thử nghiệm")).toBeInTheDocument();
  });
});
