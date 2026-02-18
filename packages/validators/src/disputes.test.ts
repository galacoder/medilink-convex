import { describe, it, expect } from "vitest";
import {
  disputeStatusSchema,
  disputeTypeSchema,
  createDisputeSchema,
  updateDisputeSchema,
  createDisputeMessageSchema,
} from "./disputes";

// ---------------------------------------------------------------------------
// disputeStatusSchema
// ---------------------------------------------------------------------------
describe("disputeStatusSchema", () => {
  it("test_disputeStatusSchema_accepts_valid_statuses", () => {
    const valid = [
      "open",
      "investigating",
      "resolved",
      "closed",
      "escalated",
    ] as const;
    for (const status of valid) {
      expect(disputeStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("test_disputeStatusSchema_rejects_invalid_status", () => {
    expect(disputeStatusSchema.safeParse("under_review").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// disputeTypeSchema
// ---------------------------------------------------------------------------
describe("disputeTypeSchema", () => {
  it("test_disputeTypeSchema_accepts_all_types", () => {
    const valid = ["quality", "pricing", "timeline", "other"] as const;
    for (const type of valid) {
      expect(disputeTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("test_disputeTypeSchema_rejects_invalid_type", () => {
    expect(disputeTypeSchema.safeParse("fraud").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createDisputeSchema
// ---------------------------------------------------------------------------
describe("createDisputeSchema", () => {
  const validDispute = {
    organizationId: "org_123",
    serviceRequestId: "req_456",
    raisedBy: "user_789",
    status: "open" as const,
    type: "quality" as const,
    descriptionVi:
      "Công việc sửa chữa không đạt yêu cầu, thiết bị vẫn còn lỗi sau khi bàn giao",
  };

  it("test_createDisputeSchema_accepts_valid_input", () => {
    const result = createDisputeSchema.safeParse(validDispute);
    expect(result.success).toBe(true);
  });

  it("test_createDisputeSchema_accepts_full_input", () => {
    const result = createDisputeSchema.safeParse({
      ...validDispute,
      assignedTo: "admin_001",
      descriptionEn:
        "Repair work did not meet requirements, device still has errors after handover",
      status: "resolved" as const,
      resolvedAt: Date.now(),
      resolutionNotes:
        "Nhà cung cấp đã đồng ý sửa chữa lại miễn phí trong vòng 7 ngày",
    });
    expect(result.success).toBe(true);
  });

  it("test_createDisputeSchema_rejects_empty_description", () => {
    const result = createDisputeSchema.safeParse({
      ...validDispute,
      descriptionVi: "", // empty
    });
    expect(result.success).toBe(false);
  });

  it("test_createDisputeSchema_rejects_short_description", () => {
    const result = createDisputeSchema.safeParse({
      ...validDispute,
      descriptionVi: "Lỗi", // less than 20 chars
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Mô tả tranh chấp phải");
  });

  it("test_createDisputeSchema_rejects_invalid_status", () => {
    const result = createDisputeSchema.safeParse({
      ...validDispute,
      status: "pending", // not a valid dispute status
    });
    expect(result.success).toBe(false);
  });

  it("test_createDisputeSchema_rejects_invalid_type", () => {
    const result = createDisputeSchema.safeParse({
      ...validDispute,
      type: "fraud", // not a valid dispute type
    });
    expect(result.success).toBe(false);
  });

  it("test_createDisputeSchema_bilingual_error_messages", () => {
    const result = createDisputeSchema.safeParse({
      ...validDispute,
      descriptionVi: "Lỗi", // too short
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    // Vietnamese part
    expect(message).toContain("ký tự");
    // English part
    expect(message).toContain("characters");
  });
});

// ---------------------------------------------------------------------------
// updateDisputeSchema
// ---------------------------------------------------------------------------
describe("updateDisputeSchema", () => {
  it("test_updateDisputeSchema_accepts_partial_input", () => {
    const result = updateDisputeSchema.safeParse({
      status: "investigating" as const,
      assignedTo: "admin_001",
    });
    expect(result.success).toBe(true);
  });

  it("test_updateDisputeSchema_accepts_empty_object", () => {
    expect(updateDisputeSchema.safeParse({}).success).toBe(true);
  });

  it("test_updateDisputeSchema_accepts_resolution_fields", () => {
    const result = updateDisputeSchema.safeParse({
      status: "resolved" as const,
      resolvedAt: Date.now(),
      resolutionNotes: "Tranh chấp đã được giải quyết thành công",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createDisputeMessageSchema
// ---------------------------------------------------------------------------
describe("createDisputeMessageSchema", () => {
  it("test_createDisputeMessageSchema_accepts_valid_input", () => {
    const result = createDisputeMessageSchema.safeParse({
      disputeId: "disp_123",
      authorId: "user_456",
      contentVi: "Tôi yêu cầu xem xét lại toàn bộ hồ sơ dịch vụ",
    });
    expect(result.success).toBe(true);
  });

  it("test_createDisputeMessageSchema_accepts_with_attachments", () => {
    const result = createDisputeMessageSchema.safeParse({
      disputeId: "disp_123",
      authorId: "user_456",
      contentVi: "Đính kèm bằng chứng sự cố",
      contentEn: "Attaching evidence",
      attachmentUrls: [
        "https://storage.medilink.vn/disputes/evidence1.jpg",
        "https://storage.medilink.vn/disputes/report.pdf",
      ],
    });
    expect(result.success).toBe(true);
  });

  it("test_createDisputeMessageSchema_rejects_empty_content", () => {
    const result = createDisputeMessageSchema.safeParse({
      disputeId: "disp_123",
      authorId: "user_456",
      contentVi: "", // empty
    });
    expect(result.success).toBe(false);
  });

  it("test_createDisputeMessageSchema_rejects_invalid_attachment_url", () => {
    const result = createDisputeMessageSchema.safeParse({
      disputeId: "disp_123",
      authorId: "user_456",
      contentVi: "Xem đính kèm",
      attachmentUrls: ["not-a-valid-url"],
    });
    expect(result.success).toBe(false);
  });
});
