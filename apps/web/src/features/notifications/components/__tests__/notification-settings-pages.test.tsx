/**
 * Tests for notification settings route pages.
 *
 * WHY: Verifies that each portal's settings/notifications page renders the
 * NotificationPreferences component with the correct structure (Card + header).
 *
 * vi: "Kiểm tra trang cài đặt thông báo" / en: "Notification settings page tests"
 */
import { screen } from "@testing-library/react";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminNotificationSettingsPage from "~/app/admin/settings/notifications/page";
import HospitalNotificationSettingsPage from "~/app/hospital/settings/notifications/page";
import ProviderNotificationSettingsPage from "~/app/provider/settings/notifications/page";
import { renderWithProviders } from "~/test-utils";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API
vi.mock("@medilink/backend", () => ({
  api: {
    notifications: {
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

describe("Notification Settings Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(
      vi.fn() as unknown as ReturnType<typeof useMutation>,
    );
    // Return null = no preferences yet, defaults to all enabled
    mockUseQuery.mockReturnValue(null as ReturnType<typeof useQuery>);
  });

  it("hospital settings/notifications renders heading and 10 switches", () => {
    renderWithProviders(<HospitalNotificationSettingsPage />);

    // Page heading uses h1
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Cài đặt thông báo",
    );
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(10);
  });

  it("provider settings/notifications renders heading and 10 switches", () => {
    renderWithProviders(<ProviderNotificationSettingsPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Cài đặt thông báo",
    );
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(10);
  });

  it("admin settings/notifications renders heading and 10 switches", () => {
    renderWithProviders(<AdminNotificationSettingsPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Cài đặt thông báo",
    );
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(10);
  });
});
