/**
 * Tests for NotificationCenter component (in features/notifications/).
 *
 * WHY: Verifies that:
 * - Bell icon button is rendered
 * - Unread badge is shown when there are unread notifications
 * - Mark all as read button is present when unread items exist
 * - The Sheet panel opens with notification list
 *
 * vi: "Kiểm tra thành phần NotificationCenter" / en: "NotificationCenter component tests"
 */
import { fireEvent, screen } from "@testing-library/react";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { NotificationCenter } from "../notification-center";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API
vi.mock("@medilink/db/api", () => ({
  api: {
    notifications: {
      listForUser: "notifications:listForUser",
      markRead: "notifications:markRead",
      markAllRead: "notifications:markAllRead",
      getPreferences: "notifications:getPreferences",
      updatePreferences: "notifications:updatePreferences",
    },
  },
}));

// Mock better-auth session
vi.mock("~/auth/client", () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: "user_123" } },
  })),
}));

const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);

function makeMockNotification(read = false, id = "notif_1") {
  return {
    _id: id,
    _creationTime: Date.now(),
    userId: "user_123",
    type: "service_request_new_quote",
    titleVi: "Thông báo mới",
    titleEn: "New notification",
    bodyVi: "Nội dung thông báo",
    bodyEn: "Notification body",
    read,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe("NotificationCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // WHY: Double cast via unknown avoids ReactMutation type mismatch in tests
    mockUseMutation.mockReturnValue(
      vi.fn() as unknown as ReturnType<typeof useMutation>,
    );
  });

  it("test_NotificationCenter_renders_bell_button", () => {
    mockUseQuery.mockReturnValue([] as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationCenter />);

    // The bell button should be present
    const button = screen.getByRole("button", {
      name: /thông báo|notifications/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("test_NotificationCenter_shows_unread_badge_when_unread_exist", () => {
    mockUseQuery.mockReturnValue([
      makeMockNotification(false, "notif_1"),
      makeMockNotification(false, "notif_2"),
    ] as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationCenter />);

    // The badge with count "2" should be visible
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("test_NotificationCenter_no_badge_when_all_read", () => {
    mockUseQuery.mockReturnValue([
      makeMockNotification(true, "notif_1"),
    ] as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationCenter />);

    // No badge for count
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("test_NotificationCenter_opens_sheet_on_bell_click", () => {
    mockUseQuery.mockReturnValue([] as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationCenter />);

    const button = screen.getByRole("button", {
      name: /thông báo|notifications/i,
    });
    fireEvent.click(button);

    // The sheet title should appear
    expect(screen.getByText("Thông báo")).toBeInTheDocument();
  });

  it("test_NotificationCenter_shows_mark_all_read_when_unread_exist", () => {
    mockUseQuery.mockReturnValue([
      makeMockNotification(false, "notif_1"),
    ] as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationCenter />);

    const button = screen.getByRole("button", {
      name: /thông báo|notifications/i,
    });
    fireEvent.click(button);

    expect(screen.getByText("Đánh dấu tất cả đã đọc")).toBeInTheDocument();
  });

  it("test_NotificationCenter_english_locale_shows_english_labels", () => {
    mockUseQuery.mockReturnValue([
      makeMockNotification(false, "notif_1"),
    ] as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationCenter locale="en" />);

    const button = screen.getByRole("button", {
      name: /open notification center/i,
    });
    fireEvent.click(button);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Mark all as read")).toBeInTheDocument();
  });
});
