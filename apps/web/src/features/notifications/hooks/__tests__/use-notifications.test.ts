/**
 * Tests for useNotifications and useNotificationPreferences hooks.
 *
 * WHY: Verifies that the hooks correctly wrap Convex queries and mutations,
 * return the expected data shape, and expose the right functions.
 *
 * vi: "Kiểm tra hook useNotifications" / en: "useNotifications hook tests"
 */
import { renderHook } from "@testing-library/react";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useNotificationPreferences } from "../use-notification-preferences";
import { useNotifications } from "../use-notifications";

// Mock convex/react before importing the hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API so api.notifications is defined
vi.mock("@medilink/backend", () => ({
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

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // WHY: Double cast via unknown avoids ReactMutation type mismatch in tests
    mockUseMutation.mockReturnValue(
      vi.fn() as unknown as ReturnType<typeof useMutation>,
    );
  });

  it("test_useNotifications_returns_notifications_array", () => {
    const mockNotifications = [
      {
        _id: "notif_1",
        type: "service_request_new_quote",
        titleVi: "Báo giá mới",
        titleEn: "New quote",
        bodyVi: "Có báo giá mới",
        bodyEn: "New quote received",
        read: false,
        userId: "user_123",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        _creationTime: Date.now(),
      },
    ];
    mockUseQuery.mockReturnValue(
      mockNotifications as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual(mockNotifications);
  });

  it("test_useNotifications_returns_undefined_when_loading", () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });

  it("test_useNotifications_computes_unread_count", () => {
    const mockNotifications = [
      {
        _id: "n1",
        read: false,
        userId: "u",
        type: "service_request_new_quote",
        titleVi: "",
        titleEn: "",
        bodyVi: "",
        bodyEn: "",
        createdAt: 0,
        updatedAt: 0,
        _creationTime: 0,
      },
      {
        _id: "n2",
        read: true,
        userId: "u",
        type: "service_request_new_quote",
        titleVi: "",
        titleEn: "",
        bodyVi: "",
        bodyEn: "",
        createdAt: 0,
        updatedAt: 0,
        _creationTime: 0,
      },
      {
        _id: "n3",
        read: false,
        userId: "u",
        type: "service_request_new_quote",
        titleVi: "",
        titleEn: "",
        bodyVi: "",
        bodyEn: "",
        createdAt: 0,
        updatedAt: 0,
        _creationTime: 0,
      },
    ];
    mockUseQuery.mockReturnValue(
      mockNotifications as ReturnType<typeof useQuery>,
    );

    const { result } = renderHook(() => useNotifications());

    expect(result.current.unreadCount).toBe(2);
  });

  it("test_useNotifications_exposes_markRead_function", () => {
    const mockMarkRead = vi.fn();
    mockUseMutation
      .mockReturnValueOnce(
        mockMarkRead as unknown as ReturnType<typeof useMutation>,
      )
      .mockReturnValue(vi.fn() as unknown as ReturnType<typeof useMutation>);
    mockUseQuery.mockReturnValue([] as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useNotifications());

    expect(typeof result.current.markRead).toBe("function");
  });

  it("test_useNotifications_exposes_markAllRead_function", () => {
    mockUseQuery.mockReturnValue([] as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useNotifications());

    expect(typeof result.current.markAllRead).toBe("function");
  });
});

describe("useNotificationPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // WHY: Double cast via unknown avoids ReactMutation type mismatch in tests
    mockUseMutation.mockReturnValue(
      vi.fn() as unknown as ReturnType<typeof useMutation>,
    );
  });

  it("test_useNotificationPreferences_returns_preferences", () => {
    const mockPrefs = {
      _id: "pref_1",
      userId: "user_123",
      preferences: { service_request_new_quote: true },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      _creationTime: Date.now(),
    };
    mockUseQuery.mockReturnValue(mockPrefs as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useNotificationPreferences());

    expect(result.current.preferences).toEqual(mockPrefs);
  });

  it("test_useNotificationPreferences_exposes_updatePreferences_function", () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useNotificationPreferences());

    expect(typeof result.current.updatePreferences).toBe("function");
  });
});
