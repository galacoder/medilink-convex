import { describe, it, expect } from "vitest";
import {
  consumableCategoryTypeSchema,
  transactionTypeSchema,
  reorderStatusSchema,
  createConsumableSchema,
  updateConsumableSchema,
  createConsumableUsageLogSchema,
  createReorderRequestSchema,
} from "./consumables";

// ---------------------------------------------------------------------------
// consumableCategoryTypeSchema
// ---------------------------------------------------------------------------
describe("consumableCategoryTypeSchema", () => {
  it("test_consumableCategoryTypeSchema_accepts_valid_types", () => {
    const valid = [
      "disposables",
      "reagents",
      "electrodes",
      "filters",
      "lubricants",
      "cleaning_agents",
      "other",
    ] as const;
    expect(valid).toHaveLength(7);
    for (const type of valid) {
      expect(consumableCategoryTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("test_consumableCategoryTypeSchema_rejects_invalid_type", () => {
    expect(consumableCategoryTypeSchema.safeParse("syringes").success).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// transactionTypeSchema
// ---------------------------------------------------------------------------
describe("transactionTypeSchema", () => {
  it("test_transactionTypeSchema_accepts_RECEIVE_USAGE", () => {
    expect(transactionTypeSchema.safeParse("RECEIVE").success).toBe(true);
    expect(transactionTypeSchema.safeParse("USAGE").success).toBe(true);
  });

  it("test_transactionTypeSchema_accepts_all_5_values", () => {
    const valid = [
      "RECEIVE",
      "USAGE",
      "ADJUSTMENT",
      "WRITE_OFF",
      "EXPIRED",
    ] as const;
    expect(valid).toHaveLength(5);
    for (const type of valid) {
      expect(transactionTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("test_transactionTypeSchema_rejects_lowercase", () => {
    expect(transactionTypeSchema.safeParse("receive").success).toBe(false);
    expect(transactionTypeSchema.safeParse("usage").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// reorderStatusSchema
// ---------------------------------------------------------------------------
describe("reorderStatusSchema", () => {
  it("test_reorderStatusSchema_accepts_all_statuses", () => {
    const valid = [
      "pending",
      "approved",
      "ordered",
      "received",
      "cancelled",
    ] as const;
    for (const status of valid) {
      expect(reorderStatusSchema.safeParse(status).success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// createConsumableSchema
// ---------------------------------------------------------------------------
describe("createConsumableSchema", () => {
  const validConsumable = {
    organizationId: "org_123",
    nameVi: "Găng tay y tế dùng một lần",
    nameEn: "Disposable medical gloves",
    unitOfMeasure: "hộp",
    categoryType: "disposables" as const,
    currentStock: 50,
    parLevel: 20,
    reorderPoint: 10,
  };

  it("test_createConsumableSchema_accepts_valid_input", () => {
    const result = createConsumableSchema.safeParse(validConsumable);
    expect(result.success).toBe(true);
  });

  it("test_createConsumableSchema_accepts_full_input", () => {
    const result = createConsumableSchema.safeParse({
      ...validConsumable,
      descriptionVi: "Găng tay nitrile không có bột, dùng một lần",
      descriptionEn: "Nitrile powder-free disposable gloves",
      sku: "GLV-NITRILE-M-100",
      manufacturer: "Kimberly-Clark",
      maxLevel: 200,
      unitCost: 150000,
      relatedEquipmentId: "eq_456",
    });
    expect(result.success).toBe(true);
  });

  it("test_createConsumableSchema_rejects_negative_parLevel", () => {
    const result = createConsumableSchema.safeParse({
      ...validConsumable,
      parLevel: -5,
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Mức tồn tối thiểu phải lớn hơn 0");
  });

  it("test_createConsumableSchema_rejects_negative_currentStock", () => {
    const result = createConsumableSchema.safeParse({
      ...validConsumable,
      currentStock: -1,
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Tồn kho không được âm");
  });

  it("test_createConsumableSchema_rejects_zero_reorderPoint", () => {
    const result = createConsumableSchema.safeParse({
      ...validConsumable,
      reorderPoint: 0,
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Điểm đặt hàng lại phải lớn hơn 0");
  });

  it("test_createConsumableSchema_rejects_short_nameVi", () => {
    const result = createConsumableSchema.safeParse({
      ...validConsumable,
      nameVi: "G",
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Tên vật tư phải");
  });

  it("test_createConsumableSchema_bilingual_error_messages", () => {
    const result = createConsumableSchema.safeParse({
      ...validConsumable,
      nameVi: "G", // too short
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    // Must contain Vietnamese part
    expect(message).toContain("ký tự");
    // Must contain English part
    expect(message).toContain("characters");
  });
});

// ---------------------------------------------------------------------------
// updateConsumableSchema
// ---------------------------------------------------------------------------
describe("updateConsumableSchema", () => {
  it("test_updateConsumableSchema_accepts_partial_input", () => {
    const result = updateConsumableSchema.safeParse({
      currentStock: 75,
      parLevel: 25,
    });
    expect(result.success).toBe(true);
  });

  it("test_updateConsumableSchema_accepts_empty_object", () => {
    expect(updateConsumableSchema.safeParse({}).success).toBe(true);
  });

  it("test_updateConsumableSchema_rejects_invalid_category", () => {
    const result = updateConsumableSchema.safeParse({
      categoryType: "needles", // not a valid enum value
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createConsumableUsageLogSchema
// ---------------------------------------------------------------------------
describe("createConsumableUsageLogSchema", () => {
  it("test_createConsumableUsageLogSchema_accepts_valid_input", () => {
    const result = createConsumableUsageLogSchema.safeParse({
      consumableId: "cons_123",
      quantity: 5,
      transactionType: "USAGE",
      usedBy: "user_456",
    });
    expect(result.success).toBe(true);
  });

  it("test_createConsumableUsageLogSchema_rejects_negative_quantity", () => {
    const result = createConsumableUsageLogSchema.safeParse({
      consumableId: "cons_123",
      quantity: -3,
      transactionType: "USAGE",
      usedBy: "user_456",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createReorderRequestSchema
// ---------------------------------------------------------------------------
describe("createReorderRequestSchema", () => {
  it("test_createReorderRequestSchema_accepts_valid_input", () => {
    const result = createReorderRequestSchema.safeParse({
      consumableId: "cons_123",
      organizationId: "org_456",
      quantity: 100,
      status: "pending",
      requestedBy: "user_789",
    });
    expect(result.success).toBe(true);
  });

  it("test_createReorderRequestSchema_rejects_zero_quantity", () => {
    const result = createReorderRequestSchema.safeParse({
      consumableId: "cons_123",
      organizationId: "org_456",
      quantity: 0,
      status: "pending",
      requestedBy: "user_789",
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Số lượng yêu cầu phải ít nhất 1");
  });
});
