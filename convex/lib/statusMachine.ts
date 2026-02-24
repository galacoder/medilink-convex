/**
 * Equipment status state machine.
 *
 * WHY: Equipment transitions follow a defined state machine to prevent invalid
 * state changes. For example, "retired" equipment cannot become "available" again.
 * This module centralizes the allowed transitions and provides validation.
 *
 * vi: "Máy trạng thái thiết bị" / en: "Equipment status state machine"
 */

import { ConvexError } from "convex/values";

/**
 * Valid equipment status values (mirrors schema.ts equipment.status union).
 * vi: "Trạng thái thiết bị" / en: "Equipment status"
 */
export type EquipmentStatus =
  | "available"
  | "in_use"
  | "maintenance"
  | "damaged"
  | "retired";

/**
 * Allowed status transitions per current state.
 *
 * WHY: Defines the directed graph of valid state transitions.
 * "retired" is a terminal state — no transitions out.
 * "damaged" can only move to maintenance (for repair) or retirement.
 */
const TRANSITIONS: Record<EquipmentStatus, EquipmentStatus[]> = {
  available: ["in_use", "maintenance", "retired"],
  in_use: ["available", "maintenance", "damaged"],
  maintenance: ["available", "damaged", "retired"],
  damaged: ["maintenance", "retired"],
  retired: [], // Terminal state — no exits
};

/**
 * Validates a status transition, throwing a bilingual ConvexError if invalid.
 *
 * WHY: Called before every status update to enforce the state machine and
 * produce a clear error message in both Vietnamese and English.
 *
 * vi: "Kiểm tra chuyển đổi trạng thái" / en: "Validate status transition"
 *
 * @param from - Current equipment status
 * @param to - Requested new status
 * @throws ConvexError if the transition is not allowed
 */
export function assertTransition(
  from: EquipmentStatus,
  to: EquipmentStatus,
): void {
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ConvexError({
      message: `Invalid status transition from "${from}" to "${to}"`,
      vi: `Chuyển đổi trạng thái không hợp lệ từ "${from}" sang "${to}"`,
    });
  }
}
