/**
 * Tests for ActiveServiceCard component.
 *
 * WHY: The active service card is the primary UI element provider staff see
 * on their mobile devices when arriving for a service. Critical information
 * (equipment, hospital, priority, status) must be immediately visible.
 * Large touch targets are required for on-site mobile use.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ActiveService } from "../../types";
import { renderWithProviders } from "~/test-utils";
import { ActiveServiceCard } from "../active-service-card";

function createMockActiveService(
  overrides?: Partial<ActiveService>,
): ActiveService {
  const now = Date.now();
  return {
    _id: "sr_active_001",
    _creationTime: now,
    organizationId: "org_hospital_001",
    equipmentId: "eq_001",
    requestedBy: "user_001",
    assignedProviderId: "prov_001",
    type: "repair",
    status: "accepted",
    priority: "medium",
    descriptionVi: "Thiết bị ECG cần sửa chữa",
    scheduledAt: now + 24 * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
    equipmentNameVi: "Máy ECG",
    equipmentNameEn: "ECG Machine",
    equipmentLocation: "Phòng khám số 3",
    hospitalOrgName: "Bệnh viện SPMET",
    acceptedQuoteAmount: 2500000,
    acceptedQuoteCurrency: "VND",
    ...overrides,
  };
}

describe("ActiveServiceCard", () => {
  it("test_ActiveServiceCard_rendersWithTestId - renders card with testid", () => {
    renderWithProviders(
      <ActiveServiceCard
        service={createMockActiveService()}
        onStartService={vi.fn()}
        onViewDetail={vi.fn()}
      />,
    );
    expect(screen.getByTestId("active-service-card")).toBeInTheDocument();
  });

  it("displays equipment name in Vietnamese", () => {
    renderWithProviders(
      <ActiveServiceCard
        service={createMockActiveService({
          equipmentNameVi: "Máy đo huyết áp",
        })}
        onStartService={vi.fn()}
        onViewDetail={vi.fn()}
      />,
    );
    expect(screen.getByText("Máy đo huyết áp")).toBeInTheDocument();
  });

  it("displays hospital name", () => {
    renderWithProviders(
      <ActiveServiceCard
        service={createMockActiveService({
          hospitalOrgName: "Bệnh viện Đại học Y Dược",
        })}
        onStartService={vi.fn()}
        onViewDetail={vi.fn()}
      />,
    );
    expect(screen.getByText("Bệnh viện Đại học Y Dược")).toBeInTheDocument();
  });

  it("shows Start Service button for accepted status", () => {
    renderWithProviders(
      <ActiveServiceCard
        service={createMockActiveService({ status: "accepted" })}
        onStartService={vi.fn()}
        onViewDetail={vi.fn()}
      />,
    );
    expect(screen.getByTestId("start-service-btn")).toBeInTheDocument();
  });

  it("shows Update Progress button for in_progress status", () => {
    renderWithProviders(
      <ActiveServiceCard
        service={createMockActiveService({ status: "in_progress" })}
        onStartService={vi.fn()}
        onViewDetail={vi.fn()}
      />,
    );
    expect(screen.getByTestId("update-progress-btn")).toBeInTheDocument();
  });

  it("displays service type in Vietnamese", () => {
    renderWithProviders(
      <ActiveServiceCard
        service={createMockActiveService({ type: "repair" })}
        onStartService={vi.fn()}
        onViewDetail={vi.fn()}
      />,
    );
    expect(screen.getByText("Sửa chữa")).toBeInTheDocument();
  });
});
