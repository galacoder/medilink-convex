import { describe, expect, it } from "vitest";

import {
  createNotificationSchema,
  notificationTypeSchema,
  updateNotificationPreferencesSchema,
} from "./notifications";

// ---------------------------------------------------------------------------
// notificationTypeSchema
// ---------------------------------------------------------------------------
describe("notificationTypeSchema", () => {
  it("test_notificationTypeSchema_accepts_all_valid_types", () => {
    const valid = [
      "service_request_new_quote",
      "service_request_quote_approved",
      "service_request_quote_rejected",
      "service_request_started",
      "service_request_completed",
      "equipment_maintenance_due",
      "equipment_status_broken",
      "consumable_stock_low",
      "dispute_new_message",
      "dispute_resolved",
    ] as const;
    for (const type of valid) {
      expect(notificationTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("test_notificationTypeSchema_rejects_invalid_type", () => {
    expect(notificationTypeSchema.safeParse("unknown_type").success).toBe(
      false,
    );
    expect(notificationTypeSchema.safeParse("").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createNotificationSchema
// ---------------------------------------------------------------------------
describe("createNotificationSchema", () => {
  it("test_createNotificationSchema_accepts_valid_input", () => {
    const valid = {
      userId: "user_123",
      type: "service_request_new_quote",
      titleVi: "Báo giá mới nhận được",
      titleEn: "New quote received",
      bodyVi: "Bạn có một báo giá mới cho yêu cầu dịch vụ.",
      bodyEn: "You have a new quote for your service request.",
    };
    expect(createNotificationSchema.safeParse(valid).success).toBe(true);
  });

  it("test_createNotificationSchema_accepts_optional_fields", () => {
    const withOptionals = {
      userId: "user_123",
      type: "equipment_maintenance_due",
      titleVi: "Nhắc nhở bảo trì thiết bị",
      titleEn: "Equipment maintenance reminder",
      bodyVi: "Thiết bị cần bảo trì trong 7 ngày.",
      bodyEn: "Equipment requires maintenance in 7 days.",
      metadata: { equipmentId: "equip_456", daysUntilDue: 7 },
    };
    expect(createNotificationSchema.safeParse(withOptionals).success).toBe(
      true,
    );
  });

  it("test_createNotificationSchema_rejects_missing_required_fields", () => {
    const missingUserId = {
      type: "service_request_new_quote",
      titleVi: "Báo giá mới",
      titleEn: "New quote",
      bodyVi: "Nội dung",
      bodyEn: "Body",
    };
    expect(createNotificationSchema.safeParse(missingUserId).success).toBe(
      false,
    );
  });

  it("test_createNotificationSchema_rejects_empty_userId", () => {
    const emptyUserId = {
      userId: "",
      type: "service_request_new_quote",
      titleVi: "Báo giá mới",
      titleEn: "New quote",
      bodyVi: "Nội dung",
      bodyEn: "Body",
    };
    expect(createNotificationSchema.safeParse(emptyUserId).success).toBe(false);
  });

  it("test_createNotificationSchema_rejects_invalid_type", () => {
    const invalidType = {
      userId: "user_123",
      type: "invalid_notification_type",
      titleVi: "Tiêu đề",
      titleEn: "Title",
      bodyVi: "Nội dung",
      bodyEn: "Body",
    };
    expect(createNotificationSchema.safeParse(invalidType).success).toBe(false);
  });

  it("test_createNotificationSchema_rejects_empty_title", () => {
    const emptyTitle = {
      userId: "user_123",
      type: "service_request_completed",
      titleVi: "",
      titleEn: "Completed",
      bodyVi: "Dịch vụ đã hoàn thành",
      bodyEn: "Service completed",
    };
    expect(createNotificationSchema.safeParse(emptyTitle).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateNotificationPreferencesSchema
// ---------------------------------------------------------------------------
describe("updateNotificationPreferencesSchema", () => {
  it("test_updateNotificationPreferencesSchema_accepts_all_enabled_true", () => {
    const allEnabled = {
      service_request_new_quote: true,
      service_request_quote_approved: true,
      service_request_quote_rejected: true,
      service_request_started: true,
      service_request_completed: true,
      equipment_maintenance_due: true,
      equipment_status_broken: true,
      consumable_stock_low: true,
      dispute_new_message: true,
      dispute_resolved: true,
    };
    expect(
      updateNotificationPreferencesSchema.safeParse(allEnabled).success,
    ).toBe(true);
  });

  it("test_updateNotificationPreferencesSchema_accepts_partial_update", () => {
    // Only some preference keys provided (partial update)
    const partial = {
      service_request_new_quote: false,
      equipment_maintenance_due: true,
    };
    expect(updateNotificationPreferencesSchema.safeParse(partial).success).toBe(
      true,
    );
  });

  it("test_updateNotificationPreferencesSchema_accepts_empty_object", () => {
    expect(updateNotificationPreferencesSchema.safeParse({}).success).toBe(
      true,
    );
  });

  it("test_updateNotificationPreferencesSchema_rejects_non_boolean_values", () => {
    const invalid = {
      service_request_new_quote: "yes",
    };
    expect(updateNotificationPreferencesSchema.safeParse(invalid).success).toBe(
      false,
    );
  });
});
