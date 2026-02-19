import { describe, expect, it } from "vitest";

import {
  batchGenerateSchema,
  generateQRCodeSchema,
  qrScanActionSchema,
  recordScanSchema,
} from "./qrCodes";

// ---------------------------------------------------------------------------
// qrScanActionSchema
// ---------------------------------------------------------------------------
describe("qrScanActionSchema", () => {
  it("test_qrScanActionSchema_accepts_valid_actions", () => {
    const validActions = ["view", "borrow", "return", "report_issue"] as const;
    for (const action of validActions) {
      expect(qrScanActionSchema.safeParse(action).success).toBe(true);
    }
  });

  it("test_qrScanActionSchema_rejects_invalid_action", () => {
    const result = qrScanActionSchema.safeParse("scan");
    expect(result.success).toBe(false);
  });

  it("test_qrScanActionSchema_rejects_empty_string", () => {
    const result = qrScanActionSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("test_qrScanActionSchema_rejects_undefined", () => {
    const result = qrScanActionSchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateQRCodeSchema
// ---------------------------------------------------------------------------
describe("generateQRCodeSchema", () => {
  it("test_generateQRCodeSchema_accepts_valid_equipment_id", () => {
    const result = generateQRCodeSchema.safeParse({
      equipmentId: "kg2abc123def456xyz",
    });
    expect(result.success).toBe(true);
  });

  it("test_generateQRCodeSchema_requires_equipmentId", () => {
    const result = generateQRCodeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("test_generateQRCodeSchema_rejects_empty_equipmentId", () => {
    const result = generateQRCodeSchema.safeParse({ equipmentId: "" });
    expect(result.success).toBe(false);
  });

  it("test_generateQRCodeSchema_bilingual_error_message", () => {
    const result = generateQRCodeSchema.safeParse({ equipmentId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message ?? "";
      // Should contain both Vietnamese and English
      expect(errorMessage).toContain("ID thiết bị");
      expect(errorMessage).toContain("Equipment ID");
    }
  });
});

// ---------------------------------------------------------------------------
// recordScanSchema
// ---------------------------------------------------------------------------
describe("recordScanSchema", () => {
  it("test_recordScanSchema_accepts_valid_view_action", () => {
    const result = recordScanSchema.safeParse({
      qrCodeId: "kg2abc123def456xyz",
      action: "view",
    });
    expect(result.success).toBe(true);
  });

  it("test_recordScanSchema_accepts_borrow_with_metadata", () => {
    const result = recordScanSchema.safeParse({
      qrCodeId: "kg2abc123def456xyz",
      action: "borrow",
      metadata: { sessionId: "session-123" },
    });
    expect(result.success).toBe(true);
  });

  it("test_recordScanSchema_requires_qrCodeId", () => {
    const result = recordScanSchema.safeParse({ action: "view" });
    expect(result.success).toBe(false);
  });

  it("test_recordScanSchema_requires_action", () => {
    const result = recordScanSchema.safeParse({
      qrCodeId: "kg2abc123def456xyz",
    });
    expect(result.success).toBe(false);
  });

  it("test_recordScanSchema_rejects_invalid_action", () => {
    const result = recordScanSchema.safeParse({
      qrCodeId: "kg2abc123def456xyz",
      action: "delete",
    });
    expect(result.success).toBe(false);
  });

  it("test_recordScanSchema_metadata_is_optional", () => {
    const result = recordScanSchema.safeParse({
      qrCodeId: "kg2abc123def456xyz",
      action: "return",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// batchGenerateSchema
// ---------------------------------------------------------------------------
describe("batchGenerateSchema", () => {
  it("test_batchGenerateSchema_accepts_valid_category_id", () => {
    const result = batchGenerateSchema.safeParse({
      categoryId: "kg2abc123def456xyz",
    });
    expect(result.success).toBe(true);
  });

  it("test_batchGenerateSchema_requires_categoryId", () => {
    const result = batchGenerateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("test_batchGenerateSchema_rejects_empty_categoryId", () => {
    const result = batchGenerateSchema.safeParse({ categoryId: "" });
    expect(result.success).toBe(false);
  });

  it("test_batchGenerateSchema_bilingual_error_message", () => {
    const result = batchGenerateSchema.safeParse({ categoryId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message ?? "";
      // Should contain both Vietnamese and English
      expect(errorMessage).toContain("ID danh mục");
      expect(errorMessage).toContain("Category ID");
    }
  });
});
