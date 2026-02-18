import { ConvexError } from "convex/values";

/**
 * Equipment status type.
 * vi: "Trạng thái thiết bị" / en: "Equipment status"
 */
export type EquipmentStatus =
  | "available"
  | "in_use"
  | "maintenance"
  | "damaged"
  | "retired";

/**
 * Valid status transitions map.
 * Each key maps to the set of statuses it can transition TO.
 *
 * Business rules:
 *   available   → can move to in_use, maintenance, damaged, or retired
 *   in_use      → can move to available (returned), maintenance, or damaged
 *   maintenance → can move to available (fixed) or damaged (worsened)
 *   damaged     → can move to available (repaired) or retired (write-off)
 *   retired     → terminal state, no further transitions
 *
 * vi: "Bảng chuyển đổi trạng thái hợp lệ" / en: "Valid status transition map"
 */
export const EQUIPMENT_TRANSITIONS: Record<EquipmentStatus, EquipmentStatus[]> =
  {
    available: ["in_use", "maintenance", "damaged", "retired"],
    in_use: ["available", "maintenance", "damaged"],
    maintenance: ["available", "damaged"],
    damaged: ["available", "retired"],
    // vi: "Trạng thái cuối - không thể chuyển tiếp" / en: "Terminal state - no transitions allowed"
    retired: [],
  };

/**
 * Checks whether a status transition is valid.
 *
 * WHY: Pure predicate with no side effects — safe to call anywhere without
 * risk of mutating state. Use this for UI checks (disabling invalid options).
 *
 * vi: "Kiểm tra chuyển đổi trạng thái có hợp lệ không" / en: "Check if status transition is valid"
 */
export function canTransition(
  from: EquipmentStatus,
  to: EquipmentStatus,
): boolean {
  return EQUIPMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Asserts that a status transition is valid, throwing a bilingual ConvexError if not.
 *
 * WHY: Used inside Convex mutations to enforce the state machine atomically.
 * Throws ConvexError (not a plain Error) so Convex surfaces the message to the client.
 *
 * vi: "Khẳng định chuyển đổi trạng thái hợp lệ hoặc ném lỗi" / en: "Assert valid transition or throw"
 */
export function assertTransition(
  from: EquipmentStatus,
  to: EquipmentStatus,
): void {
  if (!canTransition(from, to)) {
    throw new ConvexError(
      `Chuyển đổi trạng thái không hợp lệ: ${from} → ${to} (Invalid status transition: ${from} → ${to})`,
    );
  }
}

/**
 * Returns the list of valid target statuses from the given status.
 *
 * WHY: Used by the UI to display only valid next-status options in dropdowns,
 * preventing users from attempting invalid transitions upfront.
 *
 * vi: "Lấy danh sách trạng thái chuyển đổi hợp lệ" / en: "Get valid transition targets"
 */
export function getValidTransitions(
  status: EquipmentStatus,
): EquipmentStatus[] {
  return EQUIPMENT_TRANSITIONS[status] ?? [];
}
