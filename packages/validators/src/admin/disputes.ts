import { z } from "zod/v4";

/**
 * Arbitration resolution type enum.
 * Used when a platform admin makes a ruling on an escalated dispute.
 *
 * vi: "Loại phán quyết trọng tài" / en: "Arbitration resolution type"
 *
 *   refund         - vi: "Hoàn tiền đầy đủ"   / en: "Full refund to hospital"
 *   partial_refund - vi: "Hoàn tiền một phần"  / en: "Partial refund"
 *   dismiss        - vi: "Bác bỏ khiếu nại"   / en: "Dismiss in provider's favor"
 *   re_assign      - vi: "Phân công lại"       / en: "Re-assign to different provider"
 */
export const arbitrationResolutionSchema = z.enum([
  "refund",
  "partial_refund",
  "dismiss",
  "re_assign",
]);

/**
 * Schema for platform admin dispute arbitration ruling.
 *
 * Used when a platform_admin makes a decision on an escalated dispute.
 * Validates inputs for the `admin/serviceRequests.resolveDispute` mutation.
 *
 * vi: "Phán quyết trọng tài tranh chấp" / en: "Dispute arbitration ruling"
 */
export const arbitrationRulingSchema = z.object({
  disputeId: z.string().min(1, {
    message: "ID tranh chấp không được để trống (Dispute ID is required)",
  }),
  resolution: arbitrationResolutionSchema,
  reasonVi: z.string().min(10, {
    message:
      "Lý do phán quyết phải có ít nhất 10 ký tự (Ruling reason must be at least 10 characters)",
  }),
  reasonEn: z.string().optional(),
  refundAmount: z
    .number()
    .positive({
      message:
        "Số tiền hoàn trả phải lớn hơn 0 (Refund amount must be greater than 0)",
    })
    .optional(),
});

/**
 * Refinement: partial_refund requires refundAmount.
 *
 * vi: "Hoàn tiền một phần yêu cầu số tiền hoàn trả"
 * en: "Partial refund requires a refund amount"
 */
export const arbitrationRulingWithRefinementSchema =
  arbitrationRulingSchema.refine(
    (data) => {
      if (data.resolution === "partial_refund") {
        return data.refundAmount !== undefined && data.refundAmount > 0;
      }
      return true;
    },
    {
      message:
        "Hoàn tiền một phần yêu cầu số tiền hoàn trả (Partial refund requires a refund amount)",
      path: ["refundAmount"],
    },
  );

/**
 * Schema for platform admin provider re-assignment.
 *
 * Used when admin re-assigns a service request to a different provider
 * after a dispute escalation.
 *
 * vi: "Phân công lại nhà cung cấp" / en: "Provider reassignment"
 */
export const providerReassignmentSchema = z.object({
  serviceRequestId: z.string().min(1, {
    message:
      "ID yêu cầu dịch vụ không được để trống (Service request ID is required)",
  }),
  newProviderId: z.string().min(1, {
    message:
      "ID nhà cung cấp mới không được để trống (New provider ID is required)",
  }),
  reasonVi: z.string().min(10, {
    message:
      "Lý do phân công lại phải có ít nhất 10 ký tự (Reassignment reason must be at least 10 characters)",
  }),
  reasonEn: z.string().optional(),
});

/**
 * Schema for admin service request filter state.
 * Used in the cross-tenant service request list page.
 *
 * vi: "Bộ lọc yêu cầu dịch vụ (quản trị viên)" / en: "Admin service request filters"
 */
export const adminServiceRequestFiltersSchema = z.object({
  status: z
    .enum([
      "pending",
      "quoted",
      "accepted",
      "in_progress",
      "completed",
      "cancelled",
      "disputed",
    ])
    .optional(),
  hospitalId: z.string().optional(),
  providerId: z.string().optional(),
  fromDate: z.number().optional(),
  toDate: z.number().optional(),
  showBottlenecksOnly: z.boolean().optional(),
});

// TypeScript type inference exports
export type ArbitrationResolution = z.infer<typeof arbitrationResolutionSchema>;
export type ArbitrationRulingInput = z.infer<typeof arbitrationRulingSchema>;
export type ProviderReassignmentInput = z.infer<
  typeof providerReassignmentSchema
>;
export type AdminServiceRequestFilters = z.infer<
  typeof adminServiceRequestFiltersSchema
>;
