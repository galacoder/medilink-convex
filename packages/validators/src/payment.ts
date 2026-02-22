import { z } from "zod/v4";

/**
 * Payment status enum.
 * vi: "Trạng thái thanh toán" / en: "Payment status"
 *   pending   - vi: "Đang chờ"    / en: "Pending"
 *   completed - vi: "Đã hoàn tất" / en: "Completed"
 *   failed    - vi: "Thất bại"    / en: "Failed"
 *   refunded  - vi: "Đã hoàn tiền" / en: "Refunded"
 */
export const paymentStatusSchema = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
]);

/**
 * Schema for creating a payment record.
 * vi: "Tạo bản ghi thanh toán" / en: "Create payment record"
 *
 * WHY: Stub schema for future Stripe/VNPay integration.
 * No payment processor integration yet — records intent only.
 */
export const createPaymentSchema = z.object({
  amount: z.number().positive({
    message:
      "Số tiền phải lớn hơn 0 (Amount must be greater than 0)",
  }),
  currency: z.string().default("VND"),
  descriptionVi: z.string().min(3, {
    message:
      "Mô tả phải có ít nhất 3 ký tự (Description must be at least 3 characters)",
  }),
  descriptionEn: z.string().optional(),
  serviceRequestId: z.string().optional(),
  method: z.string().optional(),
});

/**
 * Schema for updating a payment status.
 * vi: "Cập nhật trạng thái thanh toán" / en: "Update payment status"
 *
 * State machine: pending -> completed | failed | refunded
 */
export const updatePaymentStatusSchema = z.object({
  paymentId: z.string().min(1, {
    message:
      "ID thanh toán không được để trống (Payment ID is required)",
  }),
  status: paymentStatusSchema,
  paidAt: z.number().optional(),
});

// TypeScript type inference exports
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
