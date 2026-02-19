/**
 * Tests for StatusFilterTabs component.
 *
 * WHY: Verifies that all status tabs render with bilingual labels and
 * that tab selection calls the onValueChange callback correctly.
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "~/test-utils";
import { StatusFilterTabs } from "../status-filter-tabs";

describe("StatusFilterTabs", () => {
  it("test_StatusFilterTabs_rendersAllStatuses", () => {
    renderWithProviders(
      <StatusFilterTabs value="all" onValueChange={vi.fn()} />,
    );

    // All status tabs should render with Vietnamese primary labels
    expect(screen.getByRole("tab", { name: /Tất cả/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Đang chờ/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Đã báo giá/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Đã chấp nhận/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Đang thực hiện/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Hoàn thành/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Đã hủy/ })).toBeInTheDocument();
  });

  it("test_StatusFilterTabs_callsOnFilterChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithProviders(
      <StatusFilterTabs value="all" onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole("tab", { name: /Đang chờ/ }));
    expect(onValueChange).toHaveBeenCalledWith("pending");
  });

  it("test_StatusFilterTabs_highlightsActiveTab", () => {
    renderWithProviders(
      <StatusFilterTabs value="pending" onValueChange={vi.fn()} />,
    );

    // The active tab should have aria-selected="true"
    const pendingTab = screen.getByRole("tab", { name: /Đang chờ/ });
    expect(pendingTab).toHaveAttribute("aria-selected", "true");
  });
});
