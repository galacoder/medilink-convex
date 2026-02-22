import { describe, expect, it } from "vitest";

import {
  createPaymentSchema,
  paymentStatusSchema,
  updatePaymentStatusSchema,
} from "./payment";

// ---------------------------------------------------------------------------
// paymentStatusSchema
// ---------------------------------------------------------------------------
describe("paymentStatusSchema", () => {
  it("test_paymentStatusSchema_accepts_all_valid_statuses", () => {
    const valid = ["pending", "completed", "failed", "refunded"] as const;
    for (const status of valid) {
      expect(paymentStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("test_paymentStatusSchema_rejects_invalid_status", () => {
    expect(paymentStatusSchema.safeParse("processing").success).toBe(false);
    expect(paymentStatusSchema.safeParse("cancelled").success).toBe(false);
    expect(paymentStatusSchema.safeParse("").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createPaymentSchema
// ---------------------------------------------------------------------------
describe("createPaymentSchema", () => {
  const validPayment = {
    amount: 500000,
    currency: "VND",
    descriptionVi: "Thanh toán phí dịch vụ sửa chữa",
  };

  it("test_createPaymentSchema_accepts_valid_input", () => {
    const result = createPaymentSchema.safeParse(validPayment);
    expect(result.success).toBe(true);
  });

  it("test_createPaymentSchema_accepts_full_input", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      descriptionEn: "Service repair fee payment",
      serviceRequestId: "sr_abc123",
      method: "bank_transfer",
    });
    expect(result.success).toBe(true);
  });

  it("test_createPaymentSchema_uses_vnd_currency_default", () => {
    const result = createPaymentSchema.safeParse({
      amount: 100000,
      descriptionVi: "Thanh toán",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("VND");
    }
  });

  it("test_createPaymentSchema_rejects_zero_amount", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      amount: 0,
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Số tiền phải lớn hơn 0");
  });

  it("test_createPaymentSchema_rejects_negative_amount", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("test_createPaymentSchema_rejects_short_description", () => {
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      descriptionVi: "AB", // less than 3 chars
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Mô tả phải");
  });

  it("test_createPaymentSchema_accepts_large_vnd_amount", () => {
    // WHY: Vietnamese medical equipment payments can be very large (up to
    // hundreds of millions VND for expensive diagnostic equipment)
    const result = createPaymentSchema.safeParse({
      ...validPayment,
      amount: 500_000_000, // 500 million VND
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updatePaymentStatusSchema
// ---------------------------------------------------------------------------
describe("updatePaymentStatusSchema", () => {
  it("test_updatePaymentStatusSchema_accepts_completed_status", () => {
    const result = updatePaymentStatusSchema.safeParse({
      paymentId: "payment_abc123",
      status: "completed",
      paidAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it("test_updatePaymentStatusSchema_accepts_failed_status", () => {
    const result = updatePaymentStatusSchema.safeParse({
      paymentId: "payment_abc123",
      status: "failed",
    });
    expect(result.success).toBe(true);
  });

  it("test_updatePaymentStatusSchema_accepts_refunded_status", () => {
    const result = updatePaymentStatusSchema.safeParse({
      paymentId: "payment_abc123",
      status: "refunded",
    });
    expect(result.success).toBe(true);
  });

  it("test_updatePaymentStatusSchema_rejects_empty_paymentId", () => {
    const result = updatePaymentStatusSchema.safeParse({
      paymentId: "",
      status: "completed",
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("ID thanh toán không được để trống");
  });

  it("test_updatePaymentStatusSchema_accepts_all_terminal_statuses", () => {
    // WHY: The validator accepts all payment statuses. The business rule
    // (only pending -> terminal state) is enforced at the Convex backend level,
    // not in the Zod validator. The validator validates form shape only.
    const terminal = ["completed", "failed", "refunded"] as const;
    for (const status of terminal) {
      const result = updatePaymentStatusSchema.safeParse({
        paymentId: "payment_abc123",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("test_updatePaymentStatusSchema_accepts_optional_paidAt", () => {
    const result = updatePaymentStatusSchema.safeParse({
      paymentId: "payment_abc123",
      status: "completed",
      // paidAt not provided — should still be valid
    });
    expect(result.success).toBe(true);
  });
});
