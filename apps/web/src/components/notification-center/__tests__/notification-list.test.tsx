/**
 * Tests for NotificationList component.
 *
 * WHY: Verifies that:
 * - Empty state is shown when no notifications exist
 * - Loading skeleton is shown during loading
 * - Notifications are grouped by date
 * - All notifications are rendered
 *
 * vi: "Kiểm tra danh sách thông báo" / en: "Notification list tests"
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Doc } from "@medilink/db/dataModel";

import { renderWithProviders } from "~/test-utils";
import { NotificationList } from "../notification-list";

function createMockNotification(
  overrides: Partial<Doc<"notifications">> = {},
): Doc<"notifications"> {
  const now = Date.now();
  return {
    _id: `notif_${Math.random()}` as Doc<"notifications">["_id"],
    _creationTime: now,
    userId: "user_456",
    type: "service_request_new_quote",
    titleVi: "Tiêu đề thông báo",
    titleEn: "Notification title",
    bodyVi: "Nội dung thông báo",
    bodyEn: "Notification body",
    read: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Doc<"notifications">;
}

describe("NotificationList", () => {
  it("test_NotificationList_shows_empty_state_when_no_notifications", () => {
    renderWithProviders(
      <NotificationList
        notifications={[]}
        isLoading={false}
        onMarkRead={vi.fn()}
      />,
    );

    expect(screen.getByText("Không có thông báo nào")).toBeInTheDocument();
  });

  it("test_NotificationList_shows_english_empty_state_when_locale_en", () => {
    renderWithProviders(
      <NotificationList
        notifications={[]}
        isLoading={false}
        onMarkRead={vi.fn()}
        locale="en"
      />,
    );

    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });

  it("test_NotificationList_shows_loading_skeletons_when_loading", () => {
    renderWithProviders(
      <NotificationList
        notifications={undefined}
        isLoading={true}
        onMarkRead={vi.fn()}
      />,
    );

    // Loading state shows skeleton elements (no notification content)
    expect(
      screen.queryByText("Không có thông báo nào"),
    ).not.toBeInTheDocument();
  });

  it("test_NotificationList_renders_all_notifications", () => {
    const notifications = [
      createMockNotification({ titleVi: "Thông báo 1" }),
      createMockNotification({ titleVi: "Thông báo 2" }),
      createMockNotification({ titleVi: "Thông báo 3" }),
    ];

    renderWithProviders(
      <NotificationList
        notifications={notifications}
        isLoading={false}
        onMarkRead={vi.fn()}
      />,
    );

    expect(screen.getByText("Thông báo 1")).toBeInTheDocument();
    expect(screen.getByText("Thông báo 2")).toBeInTheDocument();
    expect(screen.getByText("Thông báo 3")).toBeInTheDocument();
  });

  it("test_NotificationList_shows_today_date_group_label", () => {
    const notifications = [createMockNotification({ createdAt: Date.now() })];

    renderWithProviders(
      <NotificationList
        notifications={notifications}
        isLoading={false}
        onMarkRead={vi.fn()}
      />,
    );

    expect(screen.getByText("Hôm nay")).toBeInTheDocument();
  });

  it("test_NotificationList_shows_today_label_in_english", () => {
    const notifications = [createMockNotification({ createdAt: Date.now() })];

    renderWithProviders(
      <NotificationList
        notifications={notifications}
        isLoading={false}
        onMarkRead={vi.fn()}
        locale="en"
      />,
    );

    expect(screen.getByText("Today")).toBeInTheDocument();
  });
});
