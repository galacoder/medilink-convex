import { z } from "zod/v4";

/**
 * Provider status enum.
 * vi: "Trạng thái nhà cung cấp" / en: "Provider status"
 *   active               - vi: "Hoạt động"      / en: "Active"
 *   inactive             - vi: "Không hoạt động" / en: "Inactive"
 *   suspended            - vi: "Bị đình chỉ"     / en: "Suspended"
 *   pending_verification - vi: "Chờ xác minh"    / en: "Pending verification"
 */
export const providerStatusSchema = z.enum([
  "active",
  "inactive",
  "suspended",
  "pending_verification",
]);

/**
 * Provider verification status enum.
 * vi: "Trạng thái xác minh nhà cung cấp" / en: "Provider verification status"
 *   pending   - vi: "Đang chờ"    / en: "Pending"
 *   in_review - vi: "Đang xem xét" / en: "In review"
 *   verified  - vi: "Đã xác minh" / en: "Verified"
 *   rejected  - vi: "Bị từ chối"  / en: "Rejected"
 */
export const providerVerificationStatusSchema = z.enum([
  "pending",
  "in_review",
  "verified",
  "rejected",
]);

/**
 * Service specialty enum (9 values).
 * vi: "Chuyên môn dịch vụ" / en: "Service specialty"
 *   general_repair   - vi: "Sửa chữa chung"      / en: "General repair"
 *   calibration      - vi: "Hiệu chỉnh"           / en: "Calibration"
 *   installation     - vi: "Lắp đặt"              / en: "Installation"
 *   preventive_maint - vi: "Bảo trì phòng ngừa"   / en: "Preventive maintenance"
 *   electrical       - vi: "Điện"                  / en: "Electrical"
 *   software         - vi: "Phần mềm"              / en: "Software"
 *   diagnostics      - vi: "Chẩn đoán"             / en: "Diagnostics"
 *   training         - vi: "Đào tạo"               / en: "Training"
 *   other            - vi: "Khác"                  / en: "Other"
 */
export const serviceSpecialtySchema = z.enum([
  "general_repair",
  "calibration",
  "installation",
  "preventive_maint",
  "electrical",
  "software",
  "diagnostics",
  "training",
  "other",
]);

/**
 * Schema for creating a provider.
 * vi: "Tạo nhà cung cấp" / en: "Create provider"
 */
export const createProviderSchema = z.object({
  organizationId: z.string().min(1, {
    message: "ID tổ chức không được để trống (Organization ID is required)",
  }),
  nameVi: z.string().min(2, {
    message:
      "Tên nhà cung cấp phải có ít nhất 2 ký tự (Provider name must be at least 2 characters)",
  }),
  nameEn: z.string().min(2, {
    message:
      "English name must be at least 2 characters (Tên tiếng Anh phải có ít nhất 2 ký tự)",
  }),
  companyName: z.string().optional(),
  descriptionVi: z.string().optional(),
  descriptionEn: z.string().optional(),
  status: providerStatusSchema,
  verificationStatus: providerVerificationStatusSchema,
  contactEmail: z
    .string()
    .email({
      message:
        "Email không hợp lệ (Invalid email address)",
    })
    .optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  userId: z.string().optional(),
});

/**
 * Schema for updating a provider (all fields optional).
 * vi: "Cập nhật nhà cung cấp" / en: "Update provider"
 */
export const updateProviderSchema = createProviderSchema.partial();

/**
 * Schema for creating a service offering.
 * vi: "Tạo dịch vụ cung cấp" / en: "Create service offering"
 */
export const createServiceOfferingSchema = z.object({
  providerId: z.string().min(1, {
    message:
      "ID nhà cung cấp không được để trống (Provider ID is required)",
  }),
  specialty: serviceSpecialtySchema,
  descriptionVi: z.string().optional(),
  descriptionEn: z.string().optional(),
  priceEstimate: z.number().min(0, {
    message: "Giá ước tính không được âm (Price estimate cannot be negative)",
  }).optional(),
  turnaroundDays: z.number().min(1, {
    message:
      "Thời gian thực hiện phải ít nhất 1 ngày (Turnaround must be at least 1 day)",
  }).optional(),
});

export const updateServiceOfferingSchema =
  createServiceOfferingSchema.partial();

/**
 * Schema for creating a certification.
 * vi: "Tạo chứng nhận" / en: "Create certification"
 */
export const createCertificationSchema = z.object({
  providerId: z.string().min(1, {
    message:
      "ID nhà cung cấp không được để trống (Provider ID is required)",
  }),
  nameVi: z.string().min(2, {
    message:
      "Tên chứng nhận phải có ít nhất 2 ký tự (Certification name must be at least 2 characters)",
  }),
  nameEn: z.string().min(2, {
    message:
      "English name must be at least 2 characters (Tên tiếng Anh phải có ít nhất 2 ký tự)",
  }),
  issuingBody: z.string().optional(),
  issuedAt: z.number().optional(),
  expiresAt: z.number().optional(),
  documentUrl: z.string().url({
    message: "URL tài liệu không hợp lệ (Invalid document URL)",
  }).optional(),
});

export const updateCertificationSchema = createCertificationSchema.partial();

/**
 * Schema for creating a coverage area.
 * vi: "Tạo khu vực phủ sóng" / en: "Create coverage area"
 */
export const createCoverageAreaSchema = z.object({
  providerId: z.string().min(1, {
    message:
      "ID nhà cung cấp không được để trống (Provider ID is required)",
  }),
  region: z.string().min(1, {
    message:
      "Tỉnh/Thành phố không được để trống (Region is required)",
  }),
  district: z.string().optional(),
  isActive: z.boolean(),
});

export const updateCoverageAreaSchema = createCoverageAreaSchema.partial();

// TypeScript type inference exports
export type ProviderStatus = z.infer<typeof providerStatusSchema>;
export type ProviderVerificationStatus = z.infer<
  typeof providerVerificationStatusSchema
>;
export type ServiceSpecialty = z.infer<typeof serviceSpecialtySchema>;

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type CreateServiceOfferingInput = z.infer<
  typeof createServiceOfferingSchema
>;
export type UpdateServiceOfferingInput = z.infer<
  typeof updateServiceOfferingSchema
>;
export type CreateCertificationInput = z.infer<
  typeof createCertificationSchema
>;
export type UpdateCertificationInput = z.infer<
  typeof updateCertificationSchema
>;
export type CreateCoverageAreaInput = z.infer<typeof createCoverageAreaSchema>;
export type UpdateCoverageAreaInput = z.infer<typeof updateCoverageAreaSchema>;
