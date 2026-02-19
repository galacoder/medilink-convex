/**
 * Tests for IncomingRequestCard component.
 *
 * WHY: Verifies that hospital request details (equipment, hospital name,
 * priority, type) are displayed correctly, and that the "Submit Quote"
 * and "Decline" buttons are rendered.
 */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "~/test-utils";
import { IncomingRequestCard } from "../incoming-request-card";
import type { IncomingServiceRequest } from "../../types";

// Mock next/navigation to prevent router errors in tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock convex hooks used by DeclineRequestDialog
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

function createMockRequest(
  overrides?: Partial<IncomingServiceRequest>,
): IncomingServiceRequest {
  const now = Date.now();
  return {
    _id: "sr_test_001",
    _creationTime: now,
    organizationId: "org_hospital_001",
    equipmentId: "eq_test_001",
    requestedBy: "user_test_001",
    type: "repair",
    status: "pending",
    priority: "medium",
    descriptionVi: "Thiết bị bị hỏng cần sửa chữa gấp",
    createdAt: now,
    updatedAt: now,
    hospitalOrgName: "Bệnh viện Đại học Y Dược",
    equipmentNameVi: "Máy đo huyết áp",
    equipmentNameEn: "Blood Pressure Monitor",
    ...overrides,
  };
}

describe("IncomingRequestCard", () => {
  it("test_IncomingRequestCard_displaysRequestDetails - shows equipment and hospital name", () => {
    const request = createMockRequest();
    renderWithProviders(<IncomingRequestCard request={request} />);

    expect(screen.getByText("Máy đo huyết áp")).toBeInTheDocument();
    expect(screen.getByText("Bệnh viện Đại học Y Dược")).toBeInTheDocument();
  });

  it("test_IncomingRequestCard_showsActionButtons - renders Submit Quote and Decline buttons", () => {
    const request = createMockRequest();
    renderWithProviders(<IncomingRequestCard request={request} />);

    expect(screen.getByTestId("submit-quote-btn")).toBeInTheDocument();
    expect(screen.getByTestId("decline-request-btn")).toBeInTheDocument();
  });

  it("renders card with correct testid", () => {
    const request = createMockRequest();
    renderWithProviders(<IncomingRequestCard request={request} />);

    expect(screen.getByTestId("incoming-request-card")).toBeInTheDocument();
  });

  it("shows description of the issue", () => {
    const request = createMockRequest({
      descriptionVi: "Máy bị hỏng màn hình hiển thị kết quả",
    });
    renderWithProviders(<IncomingRequestCard request={request} />);

    expect(
      screen.getByText(/Máy bị hỏng màn hình/),
    ).toBeInTheDocument();
  });

  it("shows priority badge for critical requests", () => {
    const request = createMockRequest({ priority: "critical" });
    renderWithProviders(<IncomingRequestCard request={request} />);

    expect(screen.getByText("Khẩn cấp")).toBeInTheDocument();
  });

  it("falls back to equipment English name when Vietnamese is not available", () => {
    const request = createMockRequest({
      equipmentNameVi: null,
      equipmentNameEn: "Blood Pressure Monitor",
    });
    renderWithProviders(<IncomingRequestCard request={request} />);

    expect(screen.getByText("Blood Pressure Monitor")).toBeInTheDocument();
  });
});
