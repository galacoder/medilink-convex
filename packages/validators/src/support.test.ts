import { describe, expect, it } from "vitest";

import {
  createSupportMessageSchema,
  createSupportTicketSchema,
  supportTicketCategorySchema,
  supportTicketPrioritySchema,
  supportTicketStatusSchema,
  updateSupportTicketSchema,
  updateSupportTicketStatusSchema,
} from "./support";

// ---------------------------------------------------------------------------
// supportTicketStatusSchema
// ---------------------------------------------------------------------------
describe("supportTicketStatusSchema", () => {
  it("test_supportTicketStatusSchema_accepts_all_valid_statuses", () => {
    const valid = ["open", "in_progress", "resolved", "closed"] as const;
    for (const status of valid) {
      expect(supportTicketStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("test_supportTicketStatusSchema_rejects_invalid_status", () => {
    expect(supportTicketStatusSchema.safeParse("pending").success).toBe(false);
    expect(supportTicketStatusSchema.safeParse("escalated").success).toBe(false);
    expect(supportTicketStatusSchema.safeParse("").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// supportTicketPrioritySchema
// ---------------------------------------------------------------------------
describe("supportTicketPrioritySchema", () => {
  it("test_supportTicketPrioritySchema_accepts_all_valid_priorities", () => {
    const valid = ["low", "medium", "high", "critical"] as const;
    for (const priority of valid) {
      expect(supportTicketPrioritySchema.safeParse(priority).success).toBe(true);
    }
  });

  it("test_supportTicketPrioritySchema_rejects_invalid_priority", () => {
    expect(supportTicketPrioritySchema.safeParse("urgent").success).toBe(false);
    expect(supportTicketPrioritySchema.safeParse("none").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// supportTicketCategorySchema
// ---------------------------------------------------------------------------
describe("supportTicketCategorySchema", () => {
  it("test_supportTicketCategorySchema_accepts_all_valid_categories", () => {
    const valid = [
      "general",
      "technical",
      "billing",
      "feature_request",
      "other",
    ] as const;
    for (const category of valid) {
      expect(supportTicketCategorySchema.safeParse(category).success).toBe(true);
    }
  });

  it("test_supportTicketCategorySchema_rejects_invalid_category", () => {
    expect(supportTicketCategorySchema.safeParse("support").success).toBe(false);
    expect(supportTicketCategorySchema.safeParse("bug").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createSupportTicketSchema
// ---------------------------------------------------------------------------
describe("createSupportTicketSchema", () => {
  const validTicket = {
    subjectVi: "Thiết bị không hoạt động",
    descriptionVi: "Máy ECG không khởi động được sau bảo trì",
    category: "technical" as const,
    priority: "high" as const,
  };

  it("test_createSupportTicketSchema_accepts_valid_input", () => {
    const result = createSupportTicketSchema.safeParse(validTicket);
    expect(result.success).toBe(true);
  });

  it("test_createSupportTicketSchema_accepts_full_input", () => {
    const result = createSupportTicketSchema.safeParse({
      ...validTicket,
      subjectEn: "Equipment not working",
      descriptionEn: "ECG machine does not start after maintenance",
    });
    expect(result.success).toBe(true);
  });

  it("test_createSupportTicketSchema_uses_medium_priority_default", () => {
    const input = { ...validTicket };
    // @ts-expect-error — testing without priority
    delete input.priority;
    const result = createSupportTicketSchema.safeParse({
      subjectVi: validTicket.subjectVi,
      descriptionVi: validTicket.descriptionVi,
      category: validTicket.category,
    });
    // Default is 'medium' so no priority field still parses successfully
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("medium");
    }
  });

  it("test_createSupportTicketSchema_rejects_short_subject", () => {
    const result = createSupportTicketSchema.safeParse({
      ...validTicket,
      subjectVi: "AB", // less than 3 chars
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Tiêu đề phải");
  });

  it("test_createSupportTicketSchema_rejects_short_description", () => {
    const result = createSupportTicketSchema.safeParse({
      ...validTicket,
      descriptionVi: "Lỗi", // less than 10 chars
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Mô tả phải");
  });

  it("test_createSupportTicketSchema_rejects_invalid_category", () => {
    const result = createSupportTicketSchema.safeParse({
      ...validTicket,
      category: "unknown",
    });
    expect(result.success).toBe(false);
  });

  it("test_createSupportTicketSchema_rejects_invalid_priority", () => {
    const result = createSupportTicketSchema.safeParse({
      ...validTicket,
      priority: "urgent",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateSupportTicketSchema
// ---------------------------------------------------------------------------
describe("updateSupportTicketSchema", () => {
  it("test_updateSupportTicketSchema_accepts_empty_object", () => {
    const result = updateSupportTicketSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("test_updateSupportTicketSchema_accepts_partial_update", () => {
    const result = updateSupportTicketSchema.safeParse({
      priority: "critical",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateSupportTicketStatusSchema
// ---------------------------------------------------------------------------
describe("updateSupportTicketStatusSchema", () => {
  it("test_updateSupportTicketStatusSchema_accepts_valid_input", () => {
    const result = updateSupportTicketStatusSchema.safeParse({
      ticketId: "ticket_abc123",
      status: "in_progress",
    });
    expect(result.success).toBe(true);
  });

  it("test_updateSupportTicketStatusSchema_rejects_empty_ticketId", () => {
    const result = updateSupportTicketStatusSchema.safeParse({
      ticketId: "",
      status: "in_progress",
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("ID phiếu hỗ trợ");
  });

  it("test_updateSupportTicketStatusSchema_rejects_invalid_status", () => {
    const result = updateSupportTicketStatusSchema.safeParse({
      ticketId: "ticket_abc123",
      status: "investigating",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createSupportMessageSchema
// ---------------------------------------------------------------------------
describe("createSupportMessageSchema", () => {
  it("test_createSupportMessageSchema_accepts_valid_input", () => {
    const result = createSupportMessageSchema.safeParse({
      ticketId: "ticket_abc123",
      contentVi: "Vui lòng kiểm tra lại hệ thống",
    });
    expect(result.success).toBe(true);
  });

  it("test_createSupportMessageSchema_accepts_bilingual_content", () => {
    const result = createSupportMessageSchema.safeParse({
      ticketId: "ticket_abc123",
      contentVi: "Vui lòng kiểm tra lại hệ thống",
      contentEn: "Please check the system again",
      attachmentUrls: ["https://example.com/file.pdf"],
    });
    expect(result.success).toBe(true);
  });

  it("test_createSupportMessageSchema_rejects_empty_content", () => {
    const result = createSupportMessageSchema.safeParse({
      ticketId: "ticket_abc123",
      contentVi: "",
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Nội dung không được để trống");
  });

  it("test_createSupportMessageSchema_rejects_empty_ticketId", () => {
    const result = createSupportMessageSchema.safeParse({
      ticketId: "",
      contentVi: "Nội dung tin nhắn",
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("ID phiếu hỗ trợ");
  });

  it("test_createSupportMessageSchema_rejects_invalid_attachment_url", () => {
    const result = createSupportMessageSchema.safeParse({
      ticketId: "ticket_abc123",
      contentVi: "Nội dung tin nhắn",
      attachmentUrls: ["not-a-valid-url"],
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("URL đính kèm không hợp lệ");
  });
});
