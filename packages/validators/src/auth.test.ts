/**
 * Type-level and runtime validation tests for auth validators.
 * Runs via Vitest: pnpm test (from packages/validators or repo root)
 */
import { describe, expect, it } from "vitest";

import {
  orgSignUpSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  signInSchema,
  signUpSchema,
} from "./auth";

// ---------------------------------------------------------------------------
// signUpSchema
// ---------------------------------------------------------------------------

describe("signUpSchema", () => {
  it("test_signUpSchema_accepts_valid_email_password", () => {
    const result = signUpSchema.safeParse({
      email: "student@spmet.edu.vn",
      password: "SecurePass123",
      name: "Nguyen Van A",
    });
    expect(result.success).toBe(true);
  });

  it("test_signUpSchema_rejects_invalid_email", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "SecurePass123",
      name: "Nguyen Van A",
    });
    expect(result.success).toBe(false);
  });

  it("test_signUpSchema_rejects_short_password", () => {
    const result = signUpSchema.safeParse({
      email: "student@spmet.edu.vn",
      password: "short",
      name: "Nguyen Van A",
    });
    expect(result.success).toBe(false);
  });

  it("test_signUpSchema_rejects_short_name", () => {
    const result = signUpSchema.safeParse({
      email: "student@spmet.edu.vn",
      password: "SecurePass123",
      name: "A",
    });
    expect(result.success).toBe(false);
  });

  it("test_signUpSchema_bilingual_error_messages_for_password", () => {
    const result = signUpSchema.safeParse({
      email: "student@spmet.edu.vn",
      password: "short",
      name: "Nguyen Van A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find(
        (i) => i.path[0] === "password",
      );
      expect(passwordError).toBeDefined();
      if (passwordError) {
        expect(
          passwordError.message.includes("ít nhất 8 ký tự") &&
            passwordError.message.includes("at least 8 characters"),
        ).toBe(true);
      }
    }
  });

  it("test_signUpSchema_bilingual_error_messages_for_name", () => {
    const result = signUpSchema.safeParse({
      email: "student@spmet.edu.vn",
      password: "SecurePass123",
      name: "A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === "name");
      expect(nameError).toBeDefined();
      if (nameError) {
        expect(
          nameError.message.includes("ít nhất 2 ký tự") &&
            nameError.message.includes("at least 2 characters"),
        ).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// signInSchema
// ---------------------------------------------------------------------------

describe("signInSchema", () => {
  it("test_signInSchema_accepts_valid_credentials", () => {
    const result = signInSchema.safeParse({
      email: "staff@spmet.edu.vn",
      password: "AnyPassword",
    });
    expect(result.success).toBe(true);
  });

  it("test_signInSchema_rejects_invalid_email", () => {
    const result = signInSchema.safeParse({
      email: "invalid-email",
      password: "AnyPassword",
    });
    expect(result.success).toBe(false);
  });

  it("test_signInSchema_rejects_empty_password", () => {
    const result = signInSchema.safeParse({
      email: "staff@spmet.edu.vn",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// orgSignUpSchema
// ---------------------------------------------------------------------------

describe("orgSignUpSchema", () => {
  it("test_orgSignUpSchema_requires_org_type", () => {
    const result = orgSignUpSchema.safeParse({
      email: "admin@spmet-hospital.vn",
      password: "SecurePass123",
      name: "Admin User",
      orgName: "SPMET Hospital",
      // org_type intentionally omitted
    });
    expect(result.success).toBe(false);
  });

  it("test_orgSignUpSchema_accepts_hospital_org_type", () => {
    const result = orgSignUpSchema.safeParse({
      email: "admin@spmet-hospital.vn",
      password: "SecurePass123",
      name: "Admin User",
      orgName: "SPMET Hospital",
      org_type: "hospital",
    });
    expect(result.success).toBe(true);
  });

  it("test_orgSignUpSchema_accepts_provider_org_type", () => {
    const result = orgSignUpSchema.safeParse({
      email: "contact@medprovider.vn",
      password: "SecurePass123",
      name: "Provider Admin",
      orgName: "MedProvider Co.",
      org_type: "provider",
    });
    expect(result.success).toBe(true);
  });

  it("test_orgSignUpSchema_rejects_invalid_org_type", () => {
    const result = orgSignUpSchema.safeParse({
      email: "admin@spmet-hospital.vn",
      password: "SecurePass123",
      name: "Admin User",
      orgName: "SPMET Hospital",
      org_type: "clinic",
    });
    expect(result.success).toBe(false);
  });

  it("test_orgSignUpSchema_rejects_short_org_name", () => {
    const result = orgSignUpSchema.safeParse({
      email: "admin@spmet-hospital.vn",
      password: "SecurePass123",
      name: "Admin User",
      orgName: "A",
      org_type: "hospital",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// passwordResetRequestSchema
// ---------------------------------------------------------------------------

describe("passwordResetRequestSchema", () => {
  it("test_passwordResetRequestSchema_accepts_valid_email", () => {
    const result = passwordResetRequestSchema.safeParse({
      email: "user@spmet.edu.vn",
    });
    expect(result.success).toBe(true);
  });

  it("test_passwordResetRequestSchema_rejects_invalid_email", () => {
    const result = passwordResetRequestSchema.safeParse({
      email: "not-valid",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// passwordResetConfirmSchema
// ---------------------------------------------------------------------------

describe("passwordResetConfirmSchema", () => {
  it("test_passwordResetConfirmSchema_accepts_matching_passwords", () => {
    const result = passwordResetConfirmSchema.safeParse({
      token: "reset-token-abc123",
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    });
    expect(result.success).toBe(true);
  });

  it("test_passwordResetConfirmSchema_rejects_mismatched_passwords", () => {
    const result = passwordResetConfirmSchema.safeParse({
      token: "reset-token-abc123",
      password: "NewPassword123",
      confirmPassword: "DifferentPassword",
    });
    expect(result.success).toBe(false);
  });

  it("test_passwordResetConfirmSchema_bilingual_mismatch_error", () => {
    const result = passwordResetConfirmSchema.safeParse({
      token: "reset-token-abc123",
      password: "NewPassword123",
      confirmPassword: "DifferentPassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (i) => i.path[0] === "confirmPassword",
      );
      expect(confirmError).toBeDefined();
      if (confirmError) {
        expect(
          confirmError.message.includes("không khớp") &&
            confirmError.message.includes("do not match"),
        ).toBe(true);
      }
    }
  });
});
