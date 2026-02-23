/**
 * Service request workflow state machine.
 * Pure TypeScript functions — no Convex or external dependencies.
 *
 * WHY: Centralising transition logic here ensures every mutation (create, cancel,
 * updateStatus, quotes.accept, etc.) enforces the same rules without duplication.
 * Pure functions are fast to test and have zero side effects.
 *
 * Service request state machine:
 *   pending     -> quoted | cancelled
 *   quoted      -> accepted | cancelled
 *   accepted    -> in_progress | cancelled
 *   in_progress -> completed | disputed
 *   completed   -> disputed
 *   cancelled   -> (terminal)
 *   disputed    -> (terminal)
 *
 * Quote state machine:
 *   pending -> accepted | rejected | expired
 *   accepted -> (terminal)
 *   rejected -> (terminal)
 *   expired  -> (terminal)
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/** All valid status values for a service request. */
export type ServiceRequestStatus =
  | "pending"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

/** All valid status values for a quote. */
export type QuoteStatus = "pending" | "accepted" | "rejected" | "expired";

// ---------------------------------------------------------------------------
// Transition maps
// ---------------------------------------------------------------------------

/**
 * Defines every valid forward transition for service requests.
 * An empty array means the status is terminal (no further transitions allowed).
 */
export const VALID_TRANSITIONS: Record<
  ServiceRequestStatus,
  ServiceRequestStatus[]
> = {
  pending: ["quoted", "cancelled"],
  quoted: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "disputed"],
  completed: ["disputed"],
  cancelled: [],
  disputed: [],
};

/**
 * Defines every valid forward transition for quotes.
 * An empty array means the status is terminal.
 */
export const VALID_QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  pending: ["accepted", "rejected", "expired"],
  accepted: [],
  rejected: [],
  expired: [],
};

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/**
 * Returns true if transitioning from `from` to `to` is a valid service
 * request state change. Self-transitions are always invalid.
 *
 * WHY: Called in every status-changing mutation before writing to the DB so
 * we never persist an invalid state.
 */
export function canTransition(
  from: ServiceRequestStatus,
  to: ServiceRequestStatus,
): boolean {
  if (from === to) return false;
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Returns the list of statuses a service request can transition to from `from`.
 * Returns an empty array for terminal states.
 */
export function getNextStatuses(
  from: ServiceRequestStatus,
): ServiceRequestStatus[] {
  return VALID_TRANSITIONS[from];
}

/**
 * Returns true if transitioning a quote from `from` to `to` is valid.
 * Self-transitions are always invalid.
 */
export function canTransitionQuote(
  from: QuoteStatus,
  to: QuoteStatus,
): boolean {
  if (from === to) return false;
  return VALID_QUOTE_TRANSITIONS[from].includes(to);
}
