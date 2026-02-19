/**
 * Test utilities for the web app component tests.
 *
 * WHY: Provides renderWithProviders() as a drop-in replacement for
 * @testing-library/react's render(). Components that need auth or
 * navigation context in tests can use this wrapper. Mock data factories
 * create consistent test fixtures without boilerplate in each test file.
 */
import type { RenderOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { render } from "@testing-library/react";

import type {
  IncomingServiceRequest,
  ProviderQuote,
} from "./features/quotes/types";
import type {
  CreateServiceRequestInput,
  Quote,
  ServiceRating,
  ServiceRequest,
} from "./features/service-requests/types";

// ---------------------------------------------------------------------------
// Provider wrapper
// ---------------------------------------------------------------------------

/**
 * Minimal provider wrapper for unit tests.
 * Pure component tests (no Convex hooks) don't need a ConvexProvider.
 * For integration tests involving hooks, mock useQuery/useMutation instead.
 */
function AllProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * Renders a component wrapped in all required test providers.
 * Usage: const { getByText } = renderWithProviders(<MyComponent />)
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

/**
 * Creates a mock ServiceRequest with sensible defaults.
 * All fields can be overridden via the overrides parameter.
 */
export function createMockServiceRequest(
  overrides?: Partial<ServiceRequest>,
): ServiceRequest {
  const now = Date.now();
  return {
    _id: "sr_test_001",
    _creationTime: now,
    organizationId: "org_test_001",
    equipmentId: "eq_test_001",
    requestedBy: "user_test_001",
    type: "repair",
    status: "pending",
    priority: "medium",
    descriptionVi: "Thiết bị bị hỏng cần sửa chữa gấp",
    createdAt: now,
    updatedAt: now,
    equipmentNameVi: "Máy đo huyết áp",
    equipmentNameEn: "Blood Pressure Monitor",
    ...overrides,
  };
}

/**
 * Creates a mock Quote with sensible defaults.
 */
export function createMockQuote(overrides?: Partial<Quote>): Quote {
  const now = Date.now();
  return {
    _id: "q_test_001",
    _creationTime: now,
    serviceRequestId: "sr_test_001",
    providerId: "prov_test_001",
    status: "pending",
    amount: 500000,
    currency: "VND",
    validUntil: now + 7 * 24 * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
    providerNameVi: "Công ty Dịch vụ Y tế ABC",
    providerNameEn: "ABC Medical Service",
    providerOrgName: "ABC Medical Service Co.",
    ...overrides,
  };
}

/**
 * Creates a mock ServiceRating with sensible defaults.
 */
export function createMockServiceRating(
  overrides?: Partial<ServiceRating>,
): ServiceRating {
  const now = Date.now();
  return {
    _id: "rating_test_001",
    _creationTime: now,
    serviceRequestId: "sr_test_001",
    providerId: "prov_test_001",
    ratedBy: "user_test_001",
    rating: 4,
    serviceQuality: 4,
    timeliness: 5,
    professionalism: 4,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a mock CreateServiceRequestInput for form submission tests.
 */
export function createMockCreateInput(
  overrides?: Partial<CreateServiceRequestInput>,
): CreateServiceRequestInput {
  return {
    organizationId: "org_test_001",
    equipmentId: "eq_test_001",
    type: "repair",
    priority: "medium",
    descriptionVi: "Thiết bị bị hỏng cần sửa chữa",
    ...overrides,
  };
}

/**
 * Creates a mock IncomingServiceRequest (provider-side view of hospital requests).
 * All fields can be overridden via the overrides parameter.
 */
export function createMockIncomingRequest(
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

/**
 * Creates a mock ProviderQuote (quote as seen by the submitting provider).
 * All fields can be overridden via the overrides parameter.
 */
export function createMockProviderQuote(
  overrides?: Partial<ProviderQuote>,
): ProviderQuote {
  const now = Date.now();
  return {
    _id: "q_test_001",
    _creationTime: now,
    serviceRequestId: "sr_test_001",
    providerId: "prov_test_001",
    status: "pending",
    amount: 500000,
    currency: "VND",
    validUntil: now + 7 * 24 * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
    serviceRequest: {
      _id: "sr_test_001",
      status: "quoted",
      type: "repair",
      priority: "medium",
      descriptionVi: "Thiết bị bị hỏng cần sửa chữa",
      equipmentNameVi: "Máy đo huyết áp",
      equipmentNameEn: "Blood Pressure Monitor",
      hospitalOrgName: "Bệnh viện Đại học Y Dược",
    },
    ...overrides,
  };
}

// Re-export everything from @testing-library/react for convenience
export * from "@testing-library/react";
