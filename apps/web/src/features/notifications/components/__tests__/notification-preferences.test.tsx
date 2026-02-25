/**
 * Tests for NotificationPreferences component.
 *
 * WHY: Verifies that:
 * - 10 notification type toggles are rendered as switches
 * - Switches load current preferences from Convex query
 * - Toggling a switch immediately saves via updatePreferences mutation
 * - Defaults to all-true when no preferences record exists
 * - Bilingual labels are rendered (Vietnamese primary)
 *
 * vi: "Kiểm tra thành phần NotificationPreferences" / en: "NotificationPreferences component tests"
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "~/test-utils";
import { NotificationPreferences } from "../notification-preferences";

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

/** All 10 notification preference types as defined in the schema */
const ALL_PREFERENCE_TYPES = [
  "service_request_new_quote",
  "service_request_quote_approved",
  "service_request_quote_rejected",
  "service_request_started",
  "service_request_completed",
  "equipment_maintenance_due",
  "equipment_status_broken",
  "consumable_stock_low",
  "dispute_new_message",
  "dispute_resolved",
] as const;

describe("NotificationPreferences", () => {
  const mockUpdateFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(
      mockUpdateFn as unknown as ReturnType<typeof useMutation>,
    );
  });

  it("renders 10 switch toggles when preferences loaded", () => {
    // Simulate null (no prefs record yet) — defaults to all enabled
    mockUseQuery.mockReturnValue(null as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationPreferences />);

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(10);
  });

  it("defaults all switches to checked when no preferences record exists", () => {
    mockUseQuery.mockReturnValue(null as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationPreferences />);

    const switches = screen.getAllByRole("switch");
    switches.forEach((sw) => {
      expect(sw).toHaveAttribute("data-state", "checked");
    });
  });

  it("loads current preferences and reflects them in switches", () => {
    const mockPrefs = {
      _id: "pref_1",
      _creationTime: Date.now(),
      userId: "user_123",
      service_request_new_quote: true,
      service_request_quote_approved: false,
      service_request_quote_rejected: true,
      service_request_started: true,
      service_request_completed: true,
      equipment_maintenance_due: false,
      equipment_status_broken: true,
      consumable_stock_low: true,
      dispute_new_message: true,
      dispute_resolved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    mockUseQuery.mockReturnValue(mockPrefs as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationPreferences />);

    const switches = screen.getAllByRole("switch");
    // Check a known-disabled switch (service_request_quote_approved is index 1)
    expect(switches[1]).toHaveAttribute("data-state", "unchecked");
    // Check a known-enabled switch (service_request_new_quote is index 0)
    expect(switches[0]).toHaveAttribute("data-state", "checked");
  });

  it("calls updatePreferences immediately when a switch is toggled", async () => {
    mockUseQuery.mockReturnValue(null as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationPreferences />);

    const switches = screen.getAllByRole("switch");
    // Toggle the first switch off
    fireEvent.click(switches[0]!);

    await waitFor(() => {
      expect(mockUpdateFn).toHaveBeenCalledWith({
        userId: "user_123",
        preferences: { service_request_new_quote: false },
      });
    });
  });

  it("shows loading state while preferences are undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    renderWithProviders(<NotificationPreferences />);

    expect(screen.getByText(/đang tải|loading/i)).toBeInTheDocument();
  });

  it("renders bilingual labels in Vietnamese by default", () => {
    mockUseQuery.mockReturnValue(null as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationPreferences />);

    // Vietnamese label for "New Quote"
    expect(screen.getByText("Báo giá mới")).toBeInTheDocument();
  });

  it("renders English labels when locale is en", () => {
    mockUseQuery.mockReturnValue(null as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationPreferences locale="en" />);

    expect(screen.getByText("New Quote")).toBeInTheDocument();
  });

  it("renders page title and description", () => {
    mockUseQuery.mockReturnValue(null as ReturnType<typeof useQuery>);

    renderWithProviders(<NotificationPreferences />);

    expect(screen.getByText("Cài đặt thông báo")).toBeInTheDocument();
    expect(
      screen.getByText("Chọn loại thông báo bạn muốn nhận"),
    ).toBeInTheDocument();
  });
});
