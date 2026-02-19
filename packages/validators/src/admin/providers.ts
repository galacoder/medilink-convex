import { z } from "zod/v4";

/**
 * Zod validation schemas for platform admin provider management actions.
 *
 * WHY: These schemas validate form inputs on the client before they are sent
 * to Convex mutations. The bilingual error messages follow the project standard
 * (Vietnamese primary, English secondary) established in providers.ts.
 *
 * vi: "Lược đồ xác thực quản lý nhà cung cấp (quản trị viên)"
 * en: "Admin provider management validation schemas"
 */

/**
 * Schema for approving a provider registration.
 * vi: "Xác nhận phê duyệt nhà cung cấp" / en: "Approve provider schema"
 */
export const approveProviderSchema = z.object({
  providerId: z.string().min(1, {
    message: "ID nhà cung cấp không được để trống. (Provider ID is required.)",
  }),
  notes: z.string().optional(),
});

/**
 * Schema for rejecting a provider registration.
 * vi: "Xác nhận từ chối nhà cung cấp" / en: "Reject provider schema"
 */
export const rejectProviderSchema = z.object({
  providerId: z.string().min(1, {
    message: "ID nhà cung cấp không được để trống. (Provider ID is required.)",
  }),
  reason: z
    .string()
    .min(10, {
      message:
        "Lý do từ chối phải có ít nhất 10 ký tự. (Rejection reason must be at least 10 characters.)",
    })
    .max(1000, {
      message:
        "Lý do từ chối không được quá 1000 ký tự. (Rejection reason must not exceed 1000 characters.)",
    }),
});

/**
 * Schema for suspending or reactivating a provider.
 * vi: "Đình chỉ / Khôi phục nhà cung cấp" / en: "Suspend or reactivate provider schema"
 */
export const suspendProviderSchema = z.object({
  providerId: z.string().min(1, {
    message: "ID nhà cung cấp không được để trống. (Provider ID is required.)",
  }),
  reason: z
    .string()
    .min(10, {
      message:
        "Lý do phải có ít nhất 10 ký tự. (Reason must be at least 10 characters.)",
    })
    .max(1000, {
      message:
        "Lý do không được quá 1000 ký tự. (Reason must not exceed 1000 characters.)",
    }),
  reactivate: z.boolean().optional(),
});

/**
 * Schema for verifying a provider certification.
 * vi: "Xác minh chứng nhận" / en: "Verify certification schema"
 */
export const verifyCertificationSchema = z.object({
  certificationId: z.string().min(1, {
    message:
      "ID chứng nhận không được để trống. (Certification ID is required.)",
  }),
  isVerified: z.boolean(),
  expiresAt: z
    .number()
    .min(Date.now(), {
      message:
        "Ngày hết hạn phải ở tương lai. (Expiry date must be in the future.)",
    })
    .optional(),
  notes: z
    .string()
    .max(500, {
      message:
        "Ghi chú không được quá 500 ký tự. (Notes must not exceed 500 characters.)",
    })
    .optional(),
});

/**
 * Schema for filtering the provider list.
 * vi: "Bộ lọc danh sách nhà cung cấp" / en: "Provider list filter schema"
 */
export const providerListFilterSchema = z.object({
  status: z
    .enum(["active", "inactive", "suspended", "pending_verification"])
    .optional(),
  verificationStatus: z
    .enum(["pending", "in_review", "verified", "rejected"])
    .optional(),
  search: z.string().optional(),
});

// TypeScript type exports
export type ApproveProviderInput = z.infer<typeof approveProviderSchema>;
export type RejectProviderInput = z.infer<typeof rejectProviderSchema>;
export type SuspendProviderInput = z.infer<typeof suspendProviderSchema>;
export type VerifyCertificationInput = z.infer<
  typeof verifyCertificationSchema
>;
export type ProviderListFilter = z.infer<typeof providerListFilterSchema>;
