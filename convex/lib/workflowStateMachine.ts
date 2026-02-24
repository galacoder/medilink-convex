/**
 * Workflow state machine for service requests.
 *
 * WHY: Centralizes status transition validation so both mutations and UI can
 * check whether a given transition is allowed before attempting it. Prevents
 * invalid state changes at the data layer rather than per-mutation ad hoc.
 *
 * vi: "Máy trạng thái quy trình yêu cầu dịch vụ" / en: "Service request workflow state machine"
 */

/**
 * All possible statuses for a service request.
 * Matches the schema union in convex/schema.ts.
 *
 * vi: "Trạng thái yêu cầu dịch vụ" / en: "Service request status"
 */
export type ServiceRequestStatus =
  | "pending"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

/**
 * Allowed status transitions.
 *
 * Workflow:
 *   pending -> quoted (provider submits quote)
 *   quoted  -> accepted (hospital accepts quote)
 *   quoted  -> cancelled (hospital or provider cancels)
 *   accepted -> in_progress (provider starts work)
 *   accepted -> cancelled
 *   in_progress -> completed (provider marks done)
 *   in_progress -> cancelled
 *   in_progress -> disputed (dispute raised)
 *   completed -> disputed (post-completion dispute)
 *   disputed -> completed (dispute resolved in provider's favor)
 *   disputed -> cancelled (dispute resolved by cancellation)
 *   * -> cancelled (any active state can be cancelled)
 */
const VALID_TRANSITIONS: Record<ServiceRequestStatus, ServiceRequestStatus[]> =
  {
    pending: ["quoted", "cancelled"],
    quoted: ["accepted", "cancelled"],
    accepted: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled", "disputed"],
    completed: ["disputed"],
    cancelled: [],
    disputed: ["completed", "cancelled"],
  };

/**
 * Returns true if transitioning from `from` to `to` is a valid workflow step.
 *
 * vi: "Kiểm tra chuyển đổi trạng thái hợp lệ" / en: "Check if status transition is valid"
 */
export function canTransition(
  from: ServiceRequestStatus,
  to: ServiceRequestStatus,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
