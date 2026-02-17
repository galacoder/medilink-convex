import { z } from "zod/v4";

/**
 * Organization type enum.
 * Bilingual: vi: "Loại tổ chức" / en: "Organization type"
 *   - "hospital":  vi: "Bệnh viện" / en: "Hospital"
 *   - "provider":  vi: "Nhà cung cấp" / en: "Provider"
 */
export const orgTypeSchema = z.enum(["hospital", "provider"]);

/**
 * Organization membership role enum.
 * Bilingual: vi: "Vai trò thành viên" / en: "Membership role"
 *   - "owner":  vi: "Chủ sở hữu" / en: "Owner"
 *   - "admin":  vi: "Quản trị viên" / en: "Admin"
 *   - "member": vi: "Thành viên" / en: "Member"
 */
export const memberRoleSchema = z.enum(["owner", "admin", "member"]);

/**
 * Platform-level role enum (super-admins only).
 * Bilingual: vi: "Vai trò nền tảng" / en: "Platform role"
 *   - "platform_admin":   vi: "Quản trị viên nền tảng" / en: "Platform admin"
 *   - "platform_support": vi: "Hỗ trợ nền tảng" / en: "Platform support"
 */
export const platformRoleSchema = z.enum([
  "platform_admin",
  "platform_support",
]);

/**
 * Schema for creating a new organization.
 * Validates name, slug, and org_type before sending to Convex.
 */
export const createOrganizationSchema = z.object({
  // vi: "Tên tổ chức phải có ít nhất 2 ký tự" / en: "Name must be at least 2 characters"
  name: z.string().min(2, {
    message: "Tên tổ chức phải có ít nhất 2 ký tự (Name must be at least 2 characters)",
  }),
  // vi: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang"
  // en: "Slug may only contain lowercase letters, numbers, and hyphens"
  slug: z
    .string()
    .min(2, {
      message: "Slug phải có ít nhất 2 ký tự (Slug must be at least 2 characters)",
    })
    .regex(/^[a-z0-9-]+$/, {
      message:
        "Slug chỉ được chứa chữ thường, số và dấu gạch ngang (Slug may only contain lowercase letters, numbers, and hyphens)",
    }),
  // vi: "Loại tổ chức không hợp lệ" / en: "Invalid organization type"
  org_type: orgTypeSchema,
});

/**
 * Schema for updating an existing organization.
 * All fields are optional (partial update).
 */
export const updateOrganizationSchema = createOrganizationSchema.partial();

export type OrgType = z.infer<typeof orgTypeSchema>;
export type MemberRole = z.infer<typeof memberRoleSchema>;
export type PlatformRole = z.infer<typeof platformRoleSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
