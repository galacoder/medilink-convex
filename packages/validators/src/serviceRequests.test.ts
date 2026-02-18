import { describe, expect, it } from "vitest";

import {
  createQuoteSchema,
  createServiceRatingSchema,
  createServiceRequestSchema,
  quoteStatusSchema,
  serviceRequestPrioritySchema,
  serviceRequestStatusSchema,
  serviceRequestTypeSchema,
  updateServiceRequestSchema,
} from "./serviceRequests";

// ---------------------------------------------------------------------------
// serviceRequestTypeSchema
// ---------------------------------------------------------------------------
describe("serviceRequestTypeSchema", () => {
  it("test_serviceRequestTypeSchema_accepts_all_types", () => {
    const valid = [
      "repair",
      "maintenance",
      "calibration",
      "inspection",
      "installation",
      "other",
    ] as const;
    for (const type of valid) {
      expect(serviceRequestTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("test_serviceRequestTypeSchema_rejects_invalid_type", () => {
    expect(serviceRequestTypeSchema.safeParse("fix").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// serviceRequestStatusSchema
// ---------------------------------------------------------------------------
describe("serviceRequestStatusSchema", () => {
  it("test_serviceRequestStatusSchema_accepts_valid_statuses", () => {
    const valid = [
      "pending",
      "quoted",
      "accepted",
      "in_progress",
      "completed",
      "cancelled",
      "disputed",
    ] as const;
    for (const status of valid) {
      expect(serviceRequestStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("test_serviceRequestStatusSchema_rejects_invalid_status", () => {
    expect(serviceRequestStatusSchema.safeParse("open").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// serviceRequestPrioritySchema
// ---------------------------------------------------------------------------
describe("serviceRequestPrioritySchema", () => {
  it("test_serviceRequestPrioritySchema_accepts_all_priorities", () => {
    const valid = ["low", "medium", "high", "critical"] as const;
    for (const priority of valid) {
      expect(serviceRequestPrioritySchema.safeParse(priority).success).toBe(
        true,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// quoteStatusSchema
// ---------------------------------------------------------------------------
describe("quoteStatusSchema", () => {
  it("test_quoteStatusSchema_accepts_valid_statuses", () => {
    const valid = ["pending", "accepted", "rejected", "expired"] as const;
    for (const status of valid) {
      expect(quoteStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("test_quoteStatusSchema_rejects_invalid_status", () => {
    expect(quoteStatusSchema.safeParse("cancelled").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createServiceRequestSchema
// ---------------------------------------------------------------------------
describe("createServiceRequestSchema", () => {
  const validRequest = {
    organizationId: "org_123",
    equipmentId: "eq_456",
    requestedBy: "user_789",
    type: "repair" as const,
    status: "pending" as const,
    priority: "high" as const,
    descriptionVi: "Máy siêu âm bị lỗi màn hình, cần kiểm tra và sửa chữa ngay",
  };

  it("test_createServiceRequestSchema_accepts_valid_input", () => {
    const result = createServiceRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it("test_createServiceRequestSchema_accepts_full_input", () => {
    const result = createServiceRequestSchema.safeParse({
      ...validRequest,
      assignedProviderId: "prov_111",
      descriptionEn: "Ultrasound machine screen malfunction",
      scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
      completedAt: Date.now() + 48 * 60 * 60 * 1000,
    });
    expect(result.success).toBe(true);
  });

  it("test_createServiceRequestSchema_rejects_short_description", () => {
    const result = createServiceRequestSchema.safeParse({
      ...validRequest,
      descriptionVi: "Hỏng", // less than 10 chars
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Mô tả phải");
  });

  it("test_createServiceRequestSchema_rejects_missing_equipmentId", () => {
    const { equipmentId: _e, ...withoutEq } = validRequest;
    const result = createServiceRequestSchema.safeParse(withoutEq);
    expect(result.success).toBe(false);
  });

  it("test_createServiceRequestSchema_bilingual_error_messages", () => {
    const result = createServiceRequestSchema.safeParse({
      ...validRequest,
      descriptionVi: "Short", // < 10 chars
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
// updateServiceRequestSchema
// ---------------------------------------------------------------------------
describe("updateServiceRequestSchema", () => {
  it("test_updateServiceRequestSchema_accepts_partial_input", () => {
    const result = updateServiceRequestSchema.safeParse({
      status: "in_progress",
      assignedProviderId: "prov_999",
    });
    expect(result.success).toBe(true);
  });

  it("test_updateServiceRequestSchema_accepts_empty_object", () => {
    expect(updateServiceRequestSchema.safeParse({}).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createQuoteSchema
// ---------------------------------------------------------------------------
describe("createQuoteSchema", () => {
  const validQuote = {
    serviceRequestId: "req_123",
    providerId: "prov_456",
    status: "pending" as const,
    amount: 2500000,
    currency: "VND",
  };

  it("test_createQuoteSchema_accepts_valid_input", () => {
    expect(createQuoteSchema.safeParse(validQuote).success).toBe(true);
  });

  it("test_createQuoteSchema_rejects_negative_amount", () => {
    const result = createQuoteSchema.safeParse({
      ...validQuote,
      amount: -500,
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Số tiền không được âm");
  });

  it("test_createQuoteSchema_rejects_missing_currency", () => {
    const { currency: _c, ...withoutCurrency } = validQuote;
    const result = createQuoteSchema.safeParse(withoutCurrency);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createServiceRatingSchema
// ---------------------------------------------------------------------------
describe("createServiceRatingSchema", () => {
  const validRating = {
    serviceRequestId: "req_123",
    providerId: "prov_456",
    ratedBy: "user_789",
    rating: 4,
  };

  it("test_createServiceRatingSchema_accepts_valid_rating", () => {
    expect(createServiceRatingSchema.safeParse(validRating).success).toBe(true);
  });

  it("test_createServiceRatingSchema_rejects_rating_above_5", () => {
    const result = createServiceRatingSchema.safeParse({
      ...validRating,
      rating: 6,
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("tối đa là 5");
  });

  it("test_createServiceRatingSchema_rejects_rating_below_1", () => {
    const result = createServiceRatingSchema.safeParse({
      ...validRating,
      rating: 0,
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("tối thiểu là 1");
  });

  it("test_createServiceRatingSchema_accepts_optional_sub_ratings", () => {
    const result = createServiceRatingSchema.safeParse({
      ...validRating,
      commentVi: "Dịch vụ tốt",
      commentEn: "Good service",
      serviceQuality: 5,
      timeliness: 4,
      professionalism: 5,
    });
    expect(result.success).toBe(true);
  });
});
