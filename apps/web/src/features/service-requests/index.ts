/**
 * Barrel export for the service-requests feature module.
 *
 * WHY: Single import point for all service request functionality.
 * Pages and other features import from "~/features/service-requests"
 * rather than deep paths, keeping imports clean and refactoring easy.
 */

// Types and constants
export type {
  ServiceRequest,
  ServiceRequestDetail,
  ServiceRequestPriority,
  ServiceRequestStatus,
  ServiceRequestType,
  Quote,
  QuoteStatus,
  ServiceRating,
  EquipmentRef,
  CreateServiceRequestInput,
} from "./types";

export {
  SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_PRIORITIES,
  SERVICE_REQUEST_TYPES,
  QUOTE_STATUSES,
} from "./types";

// Hooks
export { useServiceRequests } from "./hooks/use-service-requests";
export type { UseServiceRequestsResult } from "./hooks/use-service-requests";

export { useServiceRequestDetail } from "./hooks/use-service-request-detail";
export type { UseServiceRequestDetailResult } from "./hooks/use-service-request-detail";

export { useServiceRequestMutations } from "./hooks/use-service-request-mutations";
export type { UseServiceRequestMutationsResult } from "./hooks/use-service-request-mutations";

export { useServiceRequestNotifications } from "./hooks/use-service-request-notifications";
export type { UseServiceRequestNotificationsResult } from "./hooks/use-service-request-notifications";
