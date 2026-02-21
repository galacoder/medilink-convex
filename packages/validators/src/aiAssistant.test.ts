/**
 * Tests for AI assistant Zod validators.
 *
 * vi: "Kiểm tra trình xác thực AI trợ lý" / en: "AI assistant validator tests"
 */
import { describe, expect, it } from "vitest";

import {
  aiAnalyticsQuestionSchema,
  aiAssistantPortalSchema,
  aiDraftServiceRequestSchema,
  aiQueryEquipmentSchema,
} from "./aiAssistant";

// ---------------------------------------------------------------------------
// aiQueryEquipmentSchema
// ---------------------------------------------------------------------------
describe("aiQueryEquipmentSchema", () => {
  it("test_aiQueryEquipmentSchema_accepts_valid_query", () => {
    const result = aiQueryEquipmentSchema.safeParse({
      query: "Find all broken X-ray machines",
      organizationId: "org123",
    });
    expect(result.success).toBe(true);
  });

  it("test_aiQueryEquipmentSchema_rejects_empty_query", () => {
    const result = aiQueryEquipmentSchema.safeParse({
      query: "",
      organizationId: "org123",
    });
    expect(result.success).toBe(false);
  });

  it("test_aiQueryEquipmentSchema_accepts_optional_status_filter", () => {
    const result = aiQueryEquipmentSchema.safeParse({
      query: "Find damaged equipment",
      organizationId: "org123",
      statusFilter: "damaged",
    });
    expect(result.success).toBe(true);
  });

  it("test_aiQueryEquipmentSchema_rejects_invalid_status_filter", () => {
    const result = aiQueryEquipmentSchema.safeParse({
      query: "Find equipment",
      organizationId: "org123",
      statusFilter: "broken", // invalid status
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// aiDraftServiceRequestSchema
// ---------------------------------------------------------------------------
describe("aiDraftServiceRequestSchema", () => {
  it("test_aiDraftServiceRequestSchema_accepts_valid_draft", () => {
    const result = aiDraftServiceRequestSchema.safeParse({
      description: "Create a maintenance request for the ultrasound in Room 3",
      organizationId: "org123",
    });
    expect(result.success).toBe(true);
  });

  it("test_aiDraftServiceRequestSchema_rejects_empty_description", () => {
    const result = aiDraftServiceRequestSchema.safeParse({
      description: "",
      organizationId: "org123",
    });
    expect(result.success).toBe(false);
  });

  it("test_aiDraftServiceRequestSchema_accepts_optional_equipment_id", () => {
    const result = aiDraftServiceRequestSchema.safeParse({
      description: "Maintenance request",
      organizationId: "org123",
      equipmentId: "eq456",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// aiAnalyticsQuestionSchema
// ---------------------------------------------------------------------------
describe("aiAnalyticsQuestionSchema", () => {
  it("test_aiAnalyticsQuestionSchema_accepts_valid_question", () => {
    const result = aiAnalyticsQuestionSchema.safeParse({
      question: "How many service requests did we create this month?",
      organizationId: "org123",
    });
    expect(result.success).toBe(true);
  });

  it("test_aiAnalyticsQuestionSchema_rejects_empty_question", () => {
    const result = aiAnalyticsQuestionSchema.safeParse({
      question: "",
      organizationId: "org123",
    });
    expect(result.success).toBe(false);
  });

  it("test_aiAnalyticsQuestionSchema_accepts_date_range", () => {
    const result = aiAnalyticsQuestionSchema.safeParse({
      question: "Total revenue this quarter?",
      organizationId: "org123",
      dateRange: "30d",
    });
    expect(result.success).toBe(true);
  });

  it("test_aiAnalyticsQuestionSchema_rejects_invalid_date_range", () => {
    const result = aiAnalyticsQuestionSchema.safeParse({
      question: "Total revenue?",
      organizationId: "org123",
      dateRange: "1year", // invalid
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// aiAssistantPortalSchema
// ---------------------------------------------------------------------------
describe("aiAssistantPortalSchema", () => {
  it("test_aiAssistantPortalSchema_accepts_hospital", () => {
    const result = aiAssistantPortalSchema.safeParse("hospital");
    expect(result.success).toBe(true);
  });

  it("test_aiAssistantPortalSchema_accepts_provider", () => {
    const result = aiAssistantPortalSchema.safeParse("provider");
    expect(result.success).toBe(true);
  });

  it("test_aiAssistantPortalSchema_rejects_invalid_portal", () => {
    const result = aiAssistantPortalSchema.safeParse("admin");
    expect(result.success).toBe(false);
  });
});
