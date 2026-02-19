/**
 * Dispute workflow state machine.
 * Pure TypeScript functions — no Convex or external dependencies.
 *
 * WHY: Centralising transition logic here ensures every mutation (create,
 * updateStatus, escalate, resolve) enforces the same rules without duplication.
 * Pure functions are fast to test and have zero side effects.
 *
 * Dispute state machine:
 *   open          -> investigating | escalated
 *   investigating -> resolved | closed | escalated
 *   resolved      -> (terminal)
 *   closed        -> (terminal)
 *   escalated     -> (terminal)
 *
 * vi: "Máy trạng thái tranh chấp" / en: "Dispute state machine"
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/** All valid status values for a dispute. */
export type DisputeStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "closed"
  | "escalated";

// ---------------------------------------------------------------------------
// Transition maps
// ---------------------------------------------------------------------------

/**
 * Defines every valid forward transition for disputes.
 * An empty array means the status is terminal (no further transitions allowed).
 *
 * vi: "Bảng chuyển đổi trạng thái" / en: "Transition table"
 */
export const DISPUTE_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  open: ["investigating", "escalated"],
  investigating: ["resolved", "closed", "escalated"],
  resolved: [],
  closed: [],
  escalated: [],
};

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/**
 * Returns true if transitioning from `from` to `to` is a valid dispute
 * state change. Self-transitions are always invalid.
 *
 * WHY: Called in every status-changing mutation before writing to the DB so
 * we never persist an invalid state.
 *
 * vi: "Kiểm tra chuyển đổi trạng thái hợp lệ" / en: "Check valid transition"
 */
export function canTransitionDispute(
  from: DisputeStatus,
  to: DisputeStatus,
): boolean {
  if (from === to) return false;
  return DISPUTE_TRANSITIONS[from].includes(to);
}

/**
 * Returns the list of statuses a dispute can transition to from `from`.
 * Returns an empty array for terminal states.
 *
 * vi: "Lấy các trạng thái tiếp theo" / en: "Get next statuses"
 */
export function getNextDisputeStatuses(from: DisputeStatus): DisputeStatus[] {
  return DISPUTE_TRANSITIONS[from];
}
