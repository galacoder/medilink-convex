/**
 * Tests for ServiceRequestTable component.
 *
 * WHY: Verifies that the table correctly renders rows, status badges,
 * priority badges, empty state, and loading skeleton. These are critical
 * for AC-01 (service request list) and AC-10 (responsive layout).
 */
import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { createMockServiceRequest, renderWithProviders } from "~/test-utils";
import { ServiceRequestTable } from "../service-request-table";

describe("ServiceRequestTable", () => {
  it("test_ServiceRequestTable_rendersRequestRows", () => {
    const requests = [
      createMockServiceRequest({
        _id: "sr_001",
        equipmentNameVi: "Máy đo huyết áp",
        type: "repair",
        status: "pending",
        priority: "medium",
      }),
      createMockServiceRequest({
        _id: "sr_002",
        equipmentNameVi: "Máy siêu âm",
        type: "maintenance",
        status: "quoted",
        priority: "high",
      }),
    ];

    renderWithProviders(<ServiceRequestTable requests={requests} isLoading={false} />);

    expect(screen.getByText("Máy đo huyết áp")).toBeInTheDocument();
    expect(screen.getByText("Máy siêu âm")).toBeInTheDocument();
  });

  it("test_ServiceRequestTable_showsStatusBadges", () => {
    const requests = [
      createMockServiceRequest({ _id: "sr_001", status: "pending" }),
      createMockServiceRequest({ _id: "sr_002", status: "quoted" }),
      createMockServiceRequest({ _id: "sr_003", status: "completed" }),
    ];

    renderWithProviders(<ServiceRequestTable requests={requests} isLoading={false} />);

    // Status labels in Vietnamese (primary)
    expect(screen.getByText("Đang chờ")).toBeInTheDocument();
    expect(screen.getByText("Đã báo giá")).toBeInTheDocument();
    expect(screen.getByText("Hoàn thành")).toBeInTheDocument();
  });

  it("test_ServiceRequestTable_showsPriorityBadges", () => {
    const requests = [
      createMockServiceRequest({ _id: "sr_001", priority: "low" }),
      createMockServiceRequest({ _id: "sr_002", priority: "critical" }),
    ];

    renderWithProviders(<ServiceRequestTable requests={requests} isLoading={false} />);

    expect(screen.getByText("Thấp")).toBeInTheDocument();
    expect(screen.getByText("Khẩn cấp")).toBeInTheDocument();
  });

  it("test_ServiceRequestTable_showsEmptyState", () => {
    renderWithProviders(<ServiceRequestTable requests={[]} isLoading={false} />);

    // Should show Vietnamese empty message
    expect(
      screen.getByText(/Không có yêu cầu dịch vụ/),
    ).toBeInTheDocument();
  });

  it("test_ServiceRequestTable_showsLoadingSkeleton", () => {
    renderWithProviders(<ServiceRequestTable requests={[]} isLoading={true} />);

    // Should show skeleton elements, not content
    expect(screen.queryByText(/Không có yêu cầu/)).not.toBeInTheDocument();
    // Skeleton elements should be present (we check aria or test-id)
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
