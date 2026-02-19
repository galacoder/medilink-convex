/**
 * Tests for audit log filter validator schemas.
 *
 * vi: "Kiểm tra lược đồ bộ lọc nhật ký kiểm tra" / en: "Audit log filter schema tests"
 */
import { describe, expect, it } from "vitest";

import {
  auditLogActionTypeSchema,
  auditLogFilterSchema,
  auditLogResourceTypeSchema,
} from "./auditLog";

// ---------------------------------------------------------------------------
// auditLogFilterSchema tests
// ---------------------------------------------------------------------------

describe("auditLogFilterSchema", () => {
  it("test_auditLogFilterSchema_acceptsEmptyFilter - accepts empty filter (no filters required)", () => {
    const result = auditLogFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("test_auditLogFilterSchema_acceptsValidActionType - accepts valid action type filter", () => {
    const result = auditLogFilterSchema.safeParse({
      actionType: "create",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actionType).toBe("create");
    }
  });

  it("test_auditLogFilterSchema_acceptsValidResourceType - accepts valid resource type filter", () => {
    const result = auditLogFilterSchema.safeParse({
      resourceType: "equipment",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.resourceType).toBe("equipment");
    }
  });

  it("test_auditLogFilterSchema_acceptsDateRange - accepts date range filter", () => {
    const now = Date.now();
    const result = auditLogFilterSchema.safeParse({
      dateFrom: now - 7 * 24 * 60 * 60 * 1000,
      dateTo: now,
    });
    expect(result.success).toBe(true);
  });

  it("test_auditLogFilterSchema_acceptsSearchText - accepts full-text search string", () => {
    const result = auditLogFilterSchema.safeParse({
      search: "equipment.status_changed",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("equipment.status_changed");
    }
  });

  it("test_auditLogFilterSchema_acceptsCursorPagination - accepts cursor for pagination", () => {
    const result = auditLogFilterSchema.safeParse({
      cursor: "cursor_abc_123",
      limit: 25,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursor).toBe("cursor_abc_123");
      expect(result.data.limit).toBe(25);
    }
  });

  it("test_auditLogFilterSchema_rejectsInvalidActionType - rejects invalid action type", () => {
    const result = auditLogFilterSchema.safeParse({
      actionType: "invalid_action",
    });
    expect(result.success).toBe(false);
  });

  it("test_auditLogFilterSchema_rejectsInvalidResourceType - rejects invalid resource type", () => {
    const result = auditLogFilterSchema.safeParse({
      resourceType: "unknown_resource",
    });
    expect(result.success).toBe(false);
  });

  it("test_auditLogFilterSchema_rejectsLimitAboveMax - rejects limit above 100", () => {
    const result = auditLogFilterSchema.safeParse({
      limit: 200,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("100");
    }
  });

  it("test_auditLogFilterSchema_defaultsLimit - applies default limit when not provided", () => {
    const result = auditLogFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });
});

// ---------------------------------------------------------------------------
// auditLogActionTypeSchema tests
// ---------------------------------------------------------------------------

describe("auditLogActionTypeSchema", () => {
  it("test_auditLogActionTypeSchema_acceptsCreate - accepts create action", () => {
    expect(auditLogActionTypeSchema.safeParse("create").success).toBe(true);
  });

  it("test_auditLogActionTypeSchema_acceptsUpdate - accepts update action", () => {
    expect(auditLogActionTypeSchema.safeParse("update").success).toBe(true);
  });

  it("test_auditLogActionTypeSchema_acceptsDelete - accepts delete action", () => {
    expect(auditLogActionTypeSchema.safeParse("delete").success).toBe(true);
  });

  it("test_auditLogActionTypeSchema_acceptsStatusChange - accepts status_change action", () => {
    expect(auditLogActionTypeSchema.safeParse("status_change").success).toBe(
      true,
    );
  });

  it("test_auditLogActionTypeSchema_rejectsUnknown - rejects unknown action", () => {
    expect(auditLogActionTypeSchema.safeParse("publish").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// auditLogResourceTypeSchema tests
// ---------------------------------------------------------------------------

describe("auditLogResourceTypeSchema", () => {
  it("test_auditLogResourceTypeSchema_acceptsEquipment - accepts equipment resource", () => {
    expect(auditLogResourceTypeSchema.safeParse("equipment").success).toBe(
      true,
    );
  });

  it("test_auditLogResourceTypeSchema_acceptsServiceRequest - accepts service_request resource", () => {
    expect(
      auditLogResourceTypeSchema.safeParse("service_request").success,
    ).toBe(true);
  });

  it("test_auditLogResourceTypeSchema_acceptsQuote - accepts quote resource", () => {
    expect(auditLogResourceTypeSchema.safeParse("quote").success).toBe(true);
  });

  it("test_auditLogResourceTypeSchema_acceptsDispute - accepts dispute resource", () => {
    expect(auditLogResourceTypeSchema.safeParse("dispute").success).toBe(true);
  });

  it("test_auditLogResourceTypeSchema_rejectsUnknown - rejects unknown resource", () => {
    expect(auditLogResourceTypeSchema.safeParse("unknown").success).toBe(false);
  });
});
