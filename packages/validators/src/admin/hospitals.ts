import { z } from "zod/v4";

/**
 * Hospital org status enum.
 * Bilingual: vi: "Trạng thái bệnh viện" / en: "Hospital status"
 *   - "active":    vi: "Đang hoạt động"  / en: "Active"
 *   - "suspended": vi: "Đã đình chỉ"    / en: "Suspended"
 *   - "trial":     vi: "Đang dùng thử"  / en: "Trial"
 */
export const hospitalStatusSchema = z.enum(["active", "suspended", "trial"]);

/**
 * Schema for onboarding a new hospital organization.
 * Platform admins create hospital orgs on behalf of customers and invite the owner.
 *
 * Bilingual:
 *   vi: "Sơ đồ thêm bệnh viện mới" / en: "Onboard hospital schema"
 */
export const onboardHospitalSchema = z.object({
  // vi: "Tên bệnh viện phải có ít nhất 2 ký tự" / en: "Name must be at least 2 characters"
  name: z.string().min(2, {
    message:
      "Tên bệnh viện phải có ít nhất 2 ký tự (Name must be at least 2 characters)",
  }),
  // vi: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang"
  // en: "Slug may only contain lowercase letters, numbers, and hyphens"
  slug: z
    .string()
    .min(2, {
      message:
        "Slug phải có ít nhất 2 ký tự (Slug must be at least 2 characters)",
    })
    .regex(/^[a-z0-9-]+$/, {
      message:
        "Slug chỉ được chứa chữ thường, số và dấu gạch ngang (Slug may only contain lowercase letters, numbers, and hyphens)",
    }),
  // vi: "Email chủ sở hữu không hợp lệ" / en: "Invalid owner email address"
  ownerEmail: z.string().email({
    message: "Email chủ sở hữu không hợp lệ (Invalid owner email address)",
  }),
  // vi: "Tên chủ sở hữu" / en: "Owner display name" (optional)
  ownerName: z.string().min(1).optional(),
});

/**
 * Schema for suspending a hospital organization.
 * Requires a reason for compliance and audit trail.
 *
 * Bilingual:
 *   vi: "Sơ đồ đình chỉ bệnh viện" / en: "Suspend hospital schema"
 */
export const suspendHospitalSchema = z.object({
  // vi: "ID bệnh viện không được để trống" / en: "Hospital ID is required"
  hospitalId: z.string().min(1, {
    message: "ID bệnh viện không được để trống (Hospital ID is required)",
  }),
  // vi: "Lý do đình chỉ phải có ít nhất 10 ký tự"
  // en: "Suspension reason must be at least 10 characters"
  reason: z.string().min(10, {
    message:
      "Lý do đình chỉ phải có ít nhất 10 ký tự (Suspension reason must be at least 10 characters)",
  }),
});

/**
 * Schema for reactivating a suspended hospital organization.
 *
 * Bilingual:
 *   vi: "Sơ đồ kích hoạt lại bệnh viện" / en: "Reactivate hospital schema"
 */
export const reactivateHospitalSchema = z.object({
  // vi: "ID bệnh viện không được để trống" / en: "Hospital ID is required"
  hospitalId: z.string().min(1, {
    message: "ID bệnh viện không được để trống (Hospital ID is required)",
  }),
  // vi: "Ghi chú kích hoạt lại" / en: "Reactivation notes" (optional)
  notes: z.string().optional(),
});

/**
 * Schema for filtering/searching hospital list.
 *
 * Bilingual:
 *   vi: "Bộ lọc danh sách bệnh viện" / en: "Hospital list filters"
 */
export const listHospitalsFilterSchema = z.object({
  // vi: "Tìm kiếm theo tên" / en: "Search by name"
  search: z.string().optional(),
  // vi: "Lọc theo trạng thái" / en: "Filter by status"
  status: hospitalStatusSchema.optional(),
  // vi: "Số lượng mỗi trang" / en: "Items per page"
  pageSize: z.number().int().min(1).max(100).optional(),
  // vi: "Con trỏ phân trang" / en: "Pagination cursor"
  cursor: z.string().optional(),
});

export type HospitalStatus = z.infer<typeof hospitalStatusSchema>;
export type OnboardHospitalInput = z.infer<typeof onboardHospitalSchema>;
export type SuspendHospitalInput = z.infer<typeof suspendHospitalSchema>;
export type ReactivateHospitalInput = z.infer<typeof reactivateHospitalSchema>;
export type ListHospitalsFilterInput = z.infer<
  typeof listHospitalsFilterSchema
>;
