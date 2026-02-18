import { describe, it, expect } from "vitest";
import {
  equipmentStatusSchema,
  equipmentConditionSchema,
  criticalitySchema,
  maintenanceTypeSchema,
  maintenanceStatusSchema,
  recurringPatternSchema,
  failureUrgencySchema,
  failureStatusSchema,
  createEquipmentSchema,
  updateEquipmentSchema,
  createMaintenanceSchema,
  createFailureReportSchema,
} from "./equipment";

// ---------------------------------------------------------------------------
// equipmentStatusSchema
// ---------------------------------------------------------------------------
describe("equipmentStatusSchema", () => {
  it("test_equipmentStatusSchema_accepts_valid_statuses", () => {
    const valid = [
      "available",
      "in_use",
      "maintenance",
      "damaged",
      "retired",
    ] as const;
    for (const status of valid) {
      expect(equipmentStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("test_equipmentStatusSchema_rejects_invalid_status", () => {
    const result = equipmentStatusSchema.safeParse("broken");
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// equipmentConditionSchema
// ---------------------------------------------------------------------------
describe("equipmentConditionSchema", () => {
  it("test_equipmentConditionSchema_accepts_all_conditions", () => {
    const valid = ["excellent", "good", "fair", "poor"] as const;
    for (const cond of valid) {
      expect(equipmentConditionSchema.safeParse(cond).success).toBe(true);
    }
  });

  it("test_equipmentConditionSchema_rejects_invalid_condition", () => {
    expect(equipmentConditionSchema.safeParse("broken").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// criticalitySchema
// ---------------------------------------------------------------------------
describe("criticalitySchema", () => {
  it("test_criticalitySchema_accepts_A_B_C", () => {
    expect(criticalitySchema.safeParse("A").success).toBe(true);
    expect(criticalitySchema.safeParse("B").success).toBe(true);
    expect(criticalitySchema.safeParse("C").success).toBe(true);
  });

  it("test_criticalitySchema_rejects_lowercase", () => {
    expect(criticalitySchema.safeParse("a").success).toBe(false);
    expect(criticalitySchema.safeParse("b").success).toBe(false);
    expect(criticalitySchema.safeParse("D").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// maintenanceTypeSchema
// ---------------------------------------------------------------------------
describe("maintenanceTypeSchema", () => {
  it("test_maintenanceTypeSchema_accepts_all_types", () => {
    const valid = [
      "preventive",
      "corrective",
      "inspection",
      "calibration",
    ] as const;
    for (const type of valid) {
      expect(maintenanceTypeSchema.safeParse(type).success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// maintenanceStatusSchema
// ---------------------------------------------------------------------------
describe("maintenanceStatusSchema", () => {
  it("test_maintenanceStatusSchema_accepts_all_statuses", () => {
    const valid = [
      "scheduled",
      "in_progress",
      "completed",
      "overdue",
      "cancelled",
    ] as const;
    for (const status of valid) {
      expect(maintenanceStatusSchema.safeParse(status).success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// recurringPatternSchema
// ---------------------------------------------------------------------------
describe("recurringPatternSchema", () => {
  it("test_recurringPatternSchema_accepts_all_6_values", () => {
    const valid = [
      "none",
      "daily",
      "weekly",
      "monthly",
      "quarterly",
      "annually",
    ] as const;
    for (const pattern of valid) {
      expect(recurringPatternSchema.safeParse(pattern).success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// failureUrgencySchema
// ---------------------------------------------------------------------------
describe("failureUrgencySchema", () => {
  it("test_failureUrgencySchema_accepts_all_urgency_levels", () => {
    const valid = ["low", "medium", "high", "critical"] as const;
    for (const urgency of valid) {
      expect(failureUrgencySchema.safeParse(urgency).success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// failureStatusSchema
// ---------------------------------------------------------------------------
describe("failureStatusSchema", () => {
  it("test_failureStatusSchema_accepts_all_statuses", () => {
    const valid = [
      "open",
      "in_progress",
      "resolved",
      "closed",
      "cancelled",
    ] as const;
    for (const status of valid) {
      expect(failureStatusSchema.safeParse(status).success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// createEquipmentSchema
// ---------------------------------------------------------------------------
describe("createEquipmentSchema", () => {
  const validInput = {
    nameVi: "Máy ECG",
    nameEn: "ECG Machine",
    categoryId: "cat_123",
    organizationId: "org_123",
    status: "available" as const,
    condition: "excellent" as const,
    criticality: "A" as const,
  };

  it("test_createEquipmentSchema_accepts_valid_input", () => {
    const result = createEquipmentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("test_createEquipmentSchema_accepts_valid_input_with_optional_fields", () => {
    const result = createEquipmentSchema.safeParse({
      ...validInput,
      serialNumber: "SN-001",
      model: "ECG-3000",
      manufacturer: "Nihon Kohden",
      purchaseDate: Date.now(),
      warrantyExpiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
      location: "Phòng cấp cứu A101",
    });
    expect(result.success).toBe(true);
  });

  it("test_createEquipmentSchema_rejects_short_nameVi", () => {
    const result = createEquipmentSchema.safeParse({
      ...validInput,
      nameVi: "X",
    });
    expect(result.success).toBe(false);
    const issue = result.error?.issues[0];
    expect(issue?.message).toContain("Tên thiết bị phải");
  });

  it("test_createEquipmentSchema_rejects_invalid_status", () => {
    const result = createEquipmentSchema.safeParse({
      ...validInput,
      status: "unknown_status",
    });
    expect(result.success).toBe(false);
  });

  it("test_createEquipmentSchema_rejects_missing_categoryId", () => {
    const { categoryId: _cat, ...withoutCategory } = validInput;
    const result = createEquipmentSchema.safeParse(withoutCategory);
    expect(result.success).toBe(false);
  });

  it("test_createEquipmentSchema_bilingual_error_messages", () => {
    const result = createEquipmentSchema.safeParse({
      ...validInput,
      nameVi: "X", // too short
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    // Message must contain both Vietnamese and English
    expect(message).toContain("Tên thiết bị");
    expect(message).toContain("Equipment name");
  });
});

// ---------------------------------------------------------------------------
// updateEquipmentSchema
// ---------------------------------------------------------------------------
describe("updateEquipmentSchema", () => {
  it("test_updateEquipmentSchema_accepts_partial_input", () => {
    // Only updating status — all other fields optional
    const result = updateEquipmentSchema.safeParse({
      status: "maintenance",
    });
    expect(result.success).toBe(true);
  });

  it("test_updateEquipmentSchema_accepts_empty_object", () => {
    const result = updateEquipmentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("test_updateEquipmentSchema_rejects_invalid_condition", () => {
    const result = updateEquipmentSchema.safeParse({
      condition: "perfect", // not a valid enum value
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createMaintenanceSchema
// ---------------------------------------------------------------------------
describe("createMaintenanceSchema", () => {
  const validMaintenance = {
    equipmentId: "eq_123",
    type: "preventive" as const,
    status: "scheduled" as const,
    recurringPattern: "monthly" as const,
    scheduledAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  it("test_createMaintenanceSchema_accepts_valid_schedule", () => {
    const result = createMaintenanceSchema.safeParse(validMaintenance);
    expect(result.success).toBe(true);
  });

  it("test_createMaintenanceSchema_accepts_full_input", () => {
    const result = createMaintenanceSchema.safeParse({
      ...validMaintenance,
      completedAt: Date.now(),
      technicianId: "user_456",
      technicianNotes: "Replaced worn parts",
      cost: 500000,
    });
    expect(result.success).toBe(true);
  });

  it("test_createMaintenanceSchema_rejects_negative_cost", () => {
    const result = createMaintenanceSchema.safeParse({
      ...validMaintenance,
      cost: -100,
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Chi phí không được âm");
  });

  it("test_createMaintenanceSchema_rejects_missing_scheduledAt", () => {
    const { scheduledAt: _s, ...withoutDate } = validMaintenance;
    const result = createMaintenanceSchema.safeParse(withoutDate);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createFailureReportSchema
// ---------------------------------------------------------------------------
describe("createFailureReportSchema", () => {
  const validReport = {
    equipmentId: "eq_123",
    urgency: "high" as const,
    status: "open" as const,
    descriptionVi:
      "Máy ngừng hoạt động đột ngột trong ca trực, cần kiểm tra ngay",
    reportedBy: "user_789",
  };

  it("test_createFailureReportSchema_accepts_valid_input", () => {
    const result = createFailureReportSchema.safeParse(validReport);
    expect(result.success).toBe(true);
  });

  it("test_createFailureReportSchema_rejects_empty_description", () => {
    const result = createFailureReportSchema.safeParse({
      ...validReport,
      descriptionVi: "Short", // less than 10 chars
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Mô tả sự cố phải");
  });

  it("test_createFailureReportSchema_rejects_invalid_urgency", () => {
    const result = createFailureReportSchema.safeParse({
      ...validReport,
      urgency: "super_urgent",
    });
    expect(result.success).toBe(false);
  });

  it("test_createFailureReportSchema_accepts_optional_resolution_fields", () => {
    const result = createFailureReportSchema.safeParse({
      ...validReport,
      status: "resolved",
      resolvedAt: Date.now(),
      resolutionNotes: "Thay thế bảng mạch chính",
      descriptionEn: "Machine stopped unexpectedly during duty",
    });
    expect(result.success).toBe(true);
  });
});
