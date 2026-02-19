import { describe, expect, it } from "vitest";

import { declineRequestSchema, submitQuoteFormSchema } from "./quotes";

// ---------------------------------------------------------------------------
// submitQuoteFormSchema tests
// ---------------------------------------------------------------------------

describe("submitQuoteFormSchema", () => {
  const validInput = {
    serviceRequestId: "sr_test_001",
    amount: 500000,
    currency: "VND" as const,
    estimatedDurationDays: 3,
    availableStartDate: Date.now() + 24 * 60 * 60 * 1000, // tomorrow
    notes: "Ghi chú thêm",
    terms: "Thanh toán sau khi hoàn thành",
  };

  it("test_submitQuoteFormSchema_validInput - accepts valid quote input", () => {
    const result = submitQuoteFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(500000);
      expect(result.data.currency).toBe("VND");
      expect(result.data.estimatedDurationDays).toBe(3);
    }
  });

  it("test_submitQuoteFormSchema_rejectsNegativeAmount - rejects negative amount", () => {
    const result = submitQuoteFormSchema.safeParse({
      ...validInput,
      amount: -100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Số tiền phải lớn hơn 0",
      );
    }
  });

  it("test_submitQuoteFormSchema_requiresAmount - rejects zero amount", () => {
    const result = submitQuoteFormSchema.safeParse({
      ...validInput,
      amount: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Số tiền phải lớn hơn 0",
      );
    }
  });

  it("rejects missing serviceRequestId", () => {
    const result = submitQuoteFormSchema.safeParse({
      ...validInput,
      serviceRequestId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "ID yêu cầu dịch vụ không được để trống",
      );
    }
  });

  it("rejects non-positive estimatedDurationDays", () => {
    const result = submitQuoteFormSchema.safeParse({
      ...validInput,
      estimatedDurationDays: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Số ngày phải lớn hơn 0",
      );
    }
  });

  it("defaults currency to VND when omitted", () => {
    const { currency: _currency, ...withoutCurrency } = validInput;
    const result = submitQuoteFormSchema.safeParse(withoutCurrency);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("VND");
    }
  });

  it("accepts USD currency", () => {
    const result = submitQuoteFormSchema.safeParse({
      ...validInput,
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid currency", () => {
    const result = submitQuoteFormSchema.safeParse({
      ...validInput,
      currency: "EUR",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional notes and terms", () => {
    const result = submitQuoteFormSchema.safeParse({
      ...validInput,
      notes: undefined,
      terms: undefined,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// declineRequestSchema tests
// ---------------------------------------------------------------------------

describe("declineRequestSchema", () => {
  const validDecline = {
    serviceRequestId: "sr_test_001",
    reason: "Yêu cầu không phù hợp với dịch vụ của chúng tôi",
  };

  it("test_declineRequestSchema_validInput - accepts valid decline input", () => {
    const result = declineRequestSchema.safeParse(validDecline);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.serviceRequestId).toBe("sr_test_001");
    }
  });

  it("test_declineRequestSchema_requiresReason - rejects empty reason", () => {
    const result = declineRequestSchema.safeParse({
      ...validDecline,
      reason: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Lý do từ chối phải có ít nhất 10 ký tự",
      );
    }
  });

  it("rejects reason shorter than 10 chars", () => {
    const result = declineRequestSchema.safeParse({
      ...validDecline,
      reason: "Quá ngắn",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Lý do từ chối phải có ít nhất 10 ký tự",
      );
    }
  });

  it("rejects missing serviceRequestId", () => {
    const result = declineRequestSchema.safeParse({
      ...validDecline,
      serviceRequestId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "ID yêu cầu dịch vụ không được để trống",
      );
    }
  });

  it("accepts exactly 10 character reason", () => {
    const result = declineRequestSchema.safeParse({
      ...validDecline,
      reason: "1234567890",
    });
    expect(result.success).toBe(true);
  });
});
