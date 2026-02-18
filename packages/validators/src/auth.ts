import { z } from "zod/v4";

import { orgTypeSchema } from "./organizations";

/**
 * Sign-up schema for individual user registration.
 * Bilingual validation messages (Vietnamese primary, English secondary).
 *
 * vi: "Đăng ký tài khoản" / en: "User sign-up"
 */
export const signUpSchema = z.object({
  // vi: "Email không hợp lệ" / en: "Invalid email address"
  email: z
    .string()
    .email("Email không hợp lệ / Invalid email address")
    .min(1, "Email là bắt buộc / Email is required"),

  // vi: "Mật khẩu phải có ít nhất 8 ký tự" / en: "Password must be at least 8 characters"
  password: z
    .string()
    .min(
      8,
      "Mật khẩu phải có ít nhất 8 ký tự / Password must be at least 8 characters",
    ),

  // vi: "Tên phải có ít nhất 2 ký tự" / en: "Name must be at least 2 characters"
  name: z
    .string()
    .min(
      2,
      "Tên phải có ít nhất 2 ký tự / Name must be at least 2 characters",
    ),
});

/**
 * Sign-in schema for email/password authentication.
 * Bilingual validation messages (Vietnamese primary, English secondary).
 *
 * vi: "Đăng nhập" / en: "Sign-in"
 */
export const signInSchema = z.object({
  // vi: "Email không hợp lệ" / en: "Invalid email address"
  email: z
    .string()
    .email("Email không hợp lệ / Invalid email address")
    .min(1, "Email là bắt buộc / Email is required"),

  // vi: "Mật khẩu là bắt buộc" / en: "Password is required"
  password: z.string().min(1, "Mật khẩu là bắt buộc / Password is required"),
});

/**
 * Organization sign-up schema — extends signUpSchema with org fields.
 * Used when a hospital or provider registers their organization.
 *
 * vi: "Đăng ký tổ chức" / en: "Organization sign-up"
 */
export const orgSignUpSchema = signUpSchema.extend({
  // vi: "Tên tổ chức phải có ít nhất 2 ký tự" / en: "Organization name must be at least 2 characters"
  orgName: z
    .string()
    .min(
      2,
      "Tên tổ chức phải có ít nhất 2 ký tự / Organization name must be at least 2 characters",
    ),

  // vi: "Loại tổ chức không hợp lệ" / en: "Invalid organization type"
  // Must be one of: "hospital" | "provider"
  org_type: orgTypeSchema,
});

/**
 * Password reset request schema.
 * Only requires the email address.
 *
 * vi: "Đặt lại mật khẩu" / en: "Password reset"
 */
export const passwordResetRequestSchema = z.object({
  // vi: "Email không hợp lệ" / en: "Invalid email address"
  email: z
    .string()
    .email("Email không hợp lệ / Invalid email address")
    .min(1, "Email là bắt buộc / Email is required"),
});

/**
 * Password reset confirm schema.
 * Used when the user submits a new password from the reset link.
 *
 * vi: "Xác nhận đặt lại mật khẩu" / en: "Confirm password reset"
 */
export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, "Token là bắt buộc / Token is required"),

    // vi: "Mật khẩu mới phải có ít nhất 8 ký tự" / en: "New password must be at least 8 characters"
    password: z
      .string()
      .min(
        8,
        "Mật khẩu mới phải có ít nhất 8 ký tự / New password must be at least 8 characters",
      ),

    // vi: "Mật khẩu xác nhận phải có ít nhất 8 ký tự" / en: "Confirmation password must be at least 8 characters"
    confirmPassword: z
      .string()
      .min(
        8,
        "Mật khẩu xác nhận phải có ít nhất 8 ký tự / Confirmation password must be at least 8 characters",
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message:
      "Mật khẩu xác nhận không khớp / Passwords do not match",
    path: ["confirmPassword"],
  });

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type OrgSignUpInput = z.infer<typeof orgSignUpSchema>;
export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetConfirmInput = z.infer<
  typeof passwordResetConfirmSchema
>;
