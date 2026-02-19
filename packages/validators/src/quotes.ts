import { z } from "zod/v4";

/**
 * Schema for provider-side quote form submission.
 *
 * WHY: Provider needs to specify amount, estimated duration, available start
 * date, optional notes and terms. Bilingual error messages support the
 * Vietnamese primary / English secondary UI pattern.
 *
 * vi: "Gửi báo giá" / en: "Submit quote"
 */
export const submitQuoteFormSchema = z.object({
  serviceRequestId: z.string().min(1, {
    message:
      "ID yêu cầu dịch vụ không được để trống (Service request ID is required)",
  }),
  amount: z.number().positive({
    message: "Số tiền phải lớn hơn 0 (Amount must be positive)",
  }),
  currency: z.enum(["VND", "USD"]).default("VND"),
  estimatedDurationDays: z
    .number()
    .int({
      message: "Số ngày phải là số nguyên (Duration must be a whole number)",
    })
    .positive({
      message: "Số ngày phải lớn hơn 0 (Duration must be positive)",
    }),
  availableStartDate: z.number().positive({
    message: "Ngày bắt đầu không hợp lệ (Available start date is required)",
  }),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

/**
 * Schema for provider declining a service request.
 *
 * WHY: Providers may choose not to quote on certain requests. Recording the
 * decline reason provides audit trail and helps hospitals understand provider
 * decisions. Reason is required with minimum length for meaningful feedback.
 *
 * vi: "Từ chối yêu cầu dịch vụ" / en: "Decline service request"
 */
export const declineRequestSchema = z.object({
  serviceRequestId: z.string().min(1, {
    message:
      "ID yêu cầu dịch vụ không được để trống (Service request ID is required)",
  }),
  reason: z.string().min(10, {
    message:
      "Lý do từ chối phải có ít nhất 10 ký tự (Decline reason must be at least 10 characters)",
  }),
});

// TypeScript type inference exports
export type SubmitQuoteFormInput = z.infer<typeof submitQuoteFormSchema>;
export type DeclineRequestInput = z.infer<typeof declineRequestSchema>;
