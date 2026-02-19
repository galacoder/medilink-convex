import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import type { EquipmentStatus } from "../lib/statusMachine";
import {
  assertTransition,
  canTransition,
  EQUIPMENT_TRANSITIONS,
  getValidTransitions,
} from "../lib/statusMachine";

// ---------------------------------------------------------------------------
// EQUIPMENT_TRANSITIONS map
// ---------------------------------------------------------------------------
describe("EQUIPMENT_TRANSITIONS", () => {
  it("test_EQUIPMENT_TRANSITIONS_has_all_5_statuses", () => {
    const statuses: EquipmentStatus[] = [
      "available",
      "in_use",
      "maintenance",
      "damaged",
      "retired",
    ];
    for (const status of statuses) {
      expect(EQUIPMENT_TRANSITIONS).toHaveProperty(status);
    }
  });

  it("test_EQUIPMENT_TRANSITIONS_retired_is_terminal", () => {
    expect(EQUIPMENT_TRANSITIONS.retired).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// canTransition - valid transitions
// ---------------------------------------------------------------------------
describe("canTransition - valid transitions", () => {
  it("test_canTransition_available_to_inUse_returns_true", () => {
    expect(canTransition("available", "in_use")).toBe(true);
  });

  it("test_canTransition_available_to_maintenance_returns_true", () => {
    expect(canTransition("available", "maintenance")).toBe(true);
  });

  it("test_canTransition_available_to_damaged_returns_true", () => {
    expect(canTransition("available", "damaged")).toBe(true);
  });

  it("test_canTransition_available_to_retired_returns_true", () => {
    expect(canTransition("available", "retired")).toBe(true);
  });

  it("test_canTransition_inUse_to_available_returns_true", () => {
    expect(canTransition("in_use", "available")).toBe(true);
  });

  it("test_canTransition_inUse_to_maintenance_returns_true", () => {
    expect(canTransition("in_use", "maintenance")).toBe(true);
  });

  it("test_canTransition_inUse_to_damaged_returns_true", () => {
    expect(canTransition("in_use", "damaged")).toBe(true);
  });

  it("test_canTransition_maintenance_to_available_returns_true", () => {
    expect(canTransition("maintenance", "available")).toBe(true);
  });

  it("test_canTransition_maintenance_to_damaged_returns_true", () => {
    expect(canTransition("maintenance", "damaged")).toBe(true);
  });

  it("test_canTransition_damaged_to_available_returns_true", () => {
    expect(canTransition("damaged", "available")).toBe(true);
  });

  it("test_canTransition_damaged_to_retired_returns_true", () => {
    expect(canTransition("damaged", "retired")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// canTransition - invalid transitions
// ---------------------------------------------------------------------------
describe("canTransition - invalid transitions", () => {
  it("test_canTransition_retired_to_any_returns_false", () => {
    const allStatuses: EquipmentStatus[] = [
      "available",
      "in_use",
      "maintenance",
      "damaged",
      "retired",
    ];
    for (const target of allStatuses) {
      expect(canTransition("retired", target)).toBe(false);
    }
  });

  it("test_canTransition_inUse_to_retired_returns_false", () => {
    expect(canTransition("in_use", "retired")).toBe(false);
  });

  it("test_canTransition_maintenance_to_inUse_returns_false", () => {
    expect(canTransition("maintenance", "in_use")).toBe(false);
  });

  it("test_canTransition_maintenance_to_retired_returns_false", () => {
    expect(canTransition("maintenance", "retired")).toBe(false);
  });

  it("test_canTransition_damaged_to_inUse_returns_false", () => {
    expect(canTransition("damaged", "in_use")).toBe(false);
  });

  it("test_canTransition_damaged_to_maintenance_returns_false", () => {
    expect(canTransition("damaged", "maintenance")).toBe(false);
  });

  it("test_canTransition_same_status_returns_false", () => {
    const allStatuses: EquipmentStatus[] = [
      "available",
      "in_use",
      "maintenance",
      "damaged",
      "retired",
    ];
    for (const status of allStatuses) {
      expect(canTransition(status, status)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// assertTransition
// ---------------------------------------------------------------------------
describe("assertTransition", () => {
  it("test_assertTransition_does_not_throw_for_valid_transition", () => {
    // available -> in_use is valid
    expect(() => assertTransition("available", "in_use")).not.toThrow();
  });

  it("test_assertTransition_does_not_throw_for_damaged_to_retired", () => {
    expect(() => assertTransition("damaged", "retired")).not.toThrow();
  });

  it("test_assertTransition_throws_ConvexError_for_invalid_transition", () => {
    expect(() => assertTransition("retired", "available")).toThrow(ConvexError);
  });

  it("test_assertTransition_throws_ConvexError_for_inUse_to_retired", () => {
    expect(() => assertTransition("in_use", "retired")).toThrow(ConvexError);
  });

  it("test_assertTransition_error_message_is_bilingual", () => {
    try {
      assertTransition("retired", "in_use");
      expect.fail("Expected ConvexError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ConvexError);
      const error = err as ConvexError<string>;
      // Message must contain both Vietnamese and English
      expect(error.data).toContain("Chuyển đổi trạng thái không hợp lệ");
      expect(error.data).toContain("Invalid status transition");
      // Must include the from/to statuses
      expect(error.data).toContain("retired");
      expect(error.data).toContain("in_use");
    }
  });

  it("test_assertTransition_throws_for_same_status", () => {
    expect(() => assertTransition("available", "available")).toThrow(
      ConvexError,
    );
  });
});

// ---------------------------------------------------------------------------
// getValidTransitions
// ---------------------------------------------------------------------------
describe("getValidTransitions", () => {
  it("test_getValidTransitions_available_returns_4_targets", () => {
    const transitions = getValidTransitions("available");
    expect(transitions).toHaveLength(4);
    expect(transitions).toContain("in_use");
    expect(transitions).toContain("maintenance");
    expect(transitions).toContain("damaged");
    expect(transitions).toContain("retired");
  });

  it("test_getValidTransitions_inUse_returns_3_targets", () => {
    const transitions = getValidTransitions("in_use");
    expect(transitions).toHaveLength(3);
    expect(transitions).toContain("available");
    expect(transitions).toContain("maintenance");
    expect(transitions).toContain("damaged");
  });

  it("test_getValidTransitions_maintenance_returns_2_targets", () => {
    const transitions = getValidTransitions("maintenance");
    expect(transitions).toHaveLength(2);
    expect(transitions).toContain("available");
    expect(transitions).toContain("damaged");
  });

  it("test_getValidTransitions_damaged_returns_2_targets", () => {
    const transitions = getValidTransitions("damaged");
    expect(transitions).toHaveLength(2);
    expect(transitions).toContain("available");
    expect(transitions).toContain("retired");
  });

  it("test_getValidTransitions_retired_returns_empty_array", () => {
    const transitions = getValidTransitions("retired");
    expect(transitions).toEqual([]);
    expect(transitions).toHaveLength(0);
  });
});
