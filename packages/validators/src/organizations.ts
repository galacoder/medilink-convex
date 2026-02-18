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
    message:
      "Tên tổ chức phải có ít nhất 2 ký tự (Name must be at least 2 characters)",
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
  // vi: "Loại tổ chức không hợp lệ" / en: "Invalid organization type"
  org_type: orgTypeSchema,
});

/**
 * Schema for updating an existing organization.
 * All fields are optional (partial update).
 */
export const updateOrganizationSchema = createOrganizationSchema.partial();

/**
 * Schema for inviting a new member to an organization.
 * Only admin and member roles can be assigned via invite (not owner).
 *
 * Bilingual:
 *   vi: "Mời thành viên vào tổ chức" / en: "Invite member to organization"
 */
export const inviteMemberSchema = z.object({
  // vi: "Email không hợp lệ" / en: "Invalid email address"
  email: z.string().email({
    message:
      "Email không hợp lệ (Invalid email address)",
  }),
  // vi: "Vai trò phải là admin hoặc member" / en: "Role must be admin or member"
  role: z.enum(["admin", "member"], {
    error: "Vai trò phải là admin hoặc member (Role must be admin or member)",
  }),
});

/**
 * Schema for updating a member's role within an organization.
 * Owner can change any role. Admin can change member roles only.
 *
 * Bilingual:
 *   vi: "Thay đổi vai trò thành viên" / en: "Update member role"
 */
export const updateMemberRoleSchema = z.object({
  // vi: "ID người dùng không được để trống" / en: "User ID is required"
  userId: z.string().min(1, {
    message:
      "ID người dùng không được để trống (User ID is required)",
  }),
  // vi: "Vai trò không hợp lệ" / en: "Invalid role"
  role: memberRoleSchema,
});

/**
 * Schema for removing a member from an organization.
 *
 * Bilingual:
 *   vi: "Xóa thành viên khỏi tổ chức" / en: "Remove member from organization"
 */
export const removeMemberSchema = z.object({
  // vi: "ID người dùng không được để trống" / en: "User ID is required"
  userId: z.string().min(1, {
    message:
      "ID người dùng không được để trống (User ID is required)",
  }),
});

/**
 * Schema for updating organization settings (name, slug, contact info, address).
 * All fields are optional — caller sends only what changed.
 *
 * Bilingual:
 *   vi: "Cập nhật cài đặt tổ chức" / en: "Update organization settings"
 */
export const updateOrgSettingsSchema = z.object({
  // vi: "Tên tổ chức phải có ít nhất 2 ký tự" / en: "Name must be at least 2 characters"
  name: z
    .string()
    .min(2, {
      message:
        "Tên tổ chức phải có ít nhất 2 ký tự (Name must be at least 2 characters)",
    })
    .optional(),
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
    })
    .optional(),
  // vi: "Email liên hệ không hợp lệ" / en: "Invalid contact email"
  contactEmail: z
    .string()
    .email({
      message:
        "Email liên hệ không hợp lệ (Invalid contact email)",
    })
    .optional(),
  // vi: "Số điện thoại liên hệ" / en: "Contact phone number"
  contactPhone: z.string().optional(),
  // vi: "Địa chỉ tổ chức" / en: "Organization address"
  address: z.string().optional(),
});

export type OrgType = z.infer<typeof orgTypeSchema>;
export type MemberRole = z.infer<typeof memberRoleSchema>;
export type PlatformRole = z.infer<typeof platformRoleSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type UpdateOrgSettingsInput = z.infer<typeof updateOrgSettingsSchema>;
