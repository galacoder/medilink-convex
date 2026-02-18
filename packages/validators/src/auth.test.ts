/**
 * Type-level and runtime validation tests for auth validators.
 * These run via: node --import tsx packages/validators/src/auth.test.ts
 * or are checked at typecheck time for type-safety assertions.
 */
import {
  orgSignUpSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  signInSchema,
  signUpSchema,
} from "./auth";

// ---------------------------------------------------------------------------
// Runtime validation tests (pure Node, no test runner required)
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`, err instanceof Error ? err.message : err);
    failed++;
  }
}

function expect<T>(value: T) {
  return {
    toBe: (expected: T) => {
      if (value !== expected) {
        throw new Error(
          `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`,
        );
      }
    },
    toBeTrue: () => {
      if (value !== true) {
        throw new Error(`Expected true, got ${JSON.stringify(value)}`);
      }
    },
    toBeFalse: () => {
      if (value !== false) {
        throw new Error(`Expected false, got ${JSON.stringify(value)}`);
      }
    },
    toContain: (substring: string) => {
      if (typeof value !== "string" || !value.includes(substring)) {
        throw new Error(
          `Expected "${String(value)}" to contain "${substring}"`,
        );
      }
    },
  };
}

// ---------------------------------------------------------------------------
// signUpSchema
// ---------------------------------------------------------------------------

console.log("\nsignUpSchema:");

test("test_signUpSchema_accepts_valid_email_password", () => {
  const result = signUpSchema.safeParse({
    email: "student@spmet.edu.vn",
    password: "SecurePass123",
    name: "Nguyen Van A",
  });
  expect(result.success).toBeTrue();
});

test("test_signUpSchema_rejects_invalid_email", () => {
  const result = signUpSchema.safeParse({
    email: "not-an-email",
    password: "SecurePass123",
    name: "Nguyen Van A",
  });
  expect(result.success).toBeFalse();
});

test("test_signUpSchema_rejects_short_password", () => {
  const result = signUpSchema.safeParse({
    email: "student@spmet.edu.vn",
    password: "short",
    name: "Nguyen Van A",
  });
  expect(result.success).toBeFalse();
});

test("test_signUpSchema_rejects_short_name", () => {
  const result = signUpSchema.safeParse({
    email: "student@spmet.edu.vn",
    password: "SecurePass123",
    name: "A",
  });
  expect(result.success).toBeFalse();
});

test("test_signUpSchema_bilingual_error_messages_for_password", () => {
  const result = signUpSchema.safeParse({
    email: "student@spmet.edu.vn",
    password: "short",
    name: "Nguyen Van A",
  });
  if (result.success) throw new Error("Should have failed");
  const passwordError = result.error.issues.find(
    (i) => i.path[0] === "password",
  );
  if (!passwordError) throw new Error("No password error found");
  expect(
    passwordError.message.includes("ít nhất 8 ký tự") &&
      passwordError.message.includes("at least 8 characters"),
  ).toBeTrue();
});

test("test_signUpSchema_bilingual_error_messages_for_name", () => {
  const result = signUpSchema.safeParse({
    email: "student@spmet.edu.vn",
    password: "SecurePass123",
    name: "A",
  });
  if (result.success) throw new Error("Should have failed");
  const nameError = result.error.issues.find((i) => i.path[0] === "name");
  if (!nameError) throw new Error("No name error found");
  expect(
    nameError.message.includes("ít nhất 2 ký tự") &&
      nameError.message.includes("at least 2 characters"),
  ).toBeTrue();
});

// ---------------------------------------------------------------------------
// signInSchema
// ---------------------------------------------------------------------------

console.log("\nsignInSchema:");

test("test_signInSchema_accepts_valid_credentials", () => {
  const result = signInSchema.safeParse({
    email: "staff@spmet.edu.vn",
    password: "AnyPassword",
  });
  expect(result.success).toBeTrue();
});

test("test_signInSchema_rejects_invalid_email", () => {
  const result = signInSchema.safeParse({
    email: "invalid-email",
    password: "AnyPassword",
  });
  expect(result.success).toBeFalse();
});

test("test_signInSchema_rejects_empty_password", () => {
  const result = signInSchema.safeParse({
    email: "staff@spmet.edu.vn",
    password: "",
  });
  expect(result.success).toBeFalse();
});

// ---------------------------------------------------------------------------
// orgSignUpSchema
// ---------------------------------------------------------------------------

console.log("\norgSignUpSchema:");

test("test_orgSignUpSchema_requires_org_type", () => {
  const result = orgSignUpSchema.safeParse({
    email: "admin@spmet-hospital.vn",
    password: "SecurePass123",
    name: "Admin User",
    orgName: "SPMET Hospital",
    // org_type intentionally omitted
  });
  expect(result.success).toBeFalse();
});

test("test_orgSignUpSchema_accepts_hospital_org_type", () => {
  const result = orgSignUpSchema.safeParse({
    email: "admin@spmet-hospital.vn",
    password: "SecurePass123",
    name: "Admin User",
    orgName: "SPMET Hospital",
    org_type: "hospital",
  });
  expect(result.success).toBeTrue();
});

test("test_orgSignUpSchema_accepts_provider_org_type", () => {
  const result = orgSignUpSchema.safeParse({
    email: "contact@medprovider.vn",
    password: "SecurePass123",
    name: "Provider Admin",
    orgName: "MedProvider Co.",
    org_type: "provider",
  });
  expect(result.success).toBeTrue();
});

test("test_orgSignUpSchema_rejects_invalid_org_type", () => {
  const result = orgSignUpSchema.safeParse({
    email: "admin@spmet-hospital.vn",
    password: "SecurePass123",
    name: "Admin User",
    orgName: "SPMET Hospital",
    org_type: "clinic",
  });
  expect(result.success).toBeFalse();
});

test("test_orgSignUpSchema_rejects_short_org_name", () => {
  const result = orgSignUpSchema.safeParse({
    email: "admin@spmet-hospital.vn",
    password: "SecurePass123",
    name: "Admin User",
    orgName: "A",
    org_type: "hospital",
  });
  expect(result.success).toBeFalse();
});

// ---------------------------------------------------------------------------
// passwordResetRequestSchema
// ---------------------------------------------------------------------------

console.log("\npasswordResetRequestSchema:");

test("test_passwordResetRequestSchema_accepts_valid_email", () => {
  const result = passwordResetRequestSchema.safeParse({
    email: "user@spmet.edu.vn",
  });
  expect(result.success).toBeTrue();
});

test("test_passwordResetRequestSchema_rejects_invalid_email", () => {
  const result = passwordResetRequestSchema.safeParse({
    email: "not-valid",
  });
  expect(result.success).toBeFalse();
});

// ---------------------------------------------------------------------------
// passwordResetConfirmSchema
// ---------------------------------------------------------------------------

console.log("\npasswordResetConfirmSchema:");

test("test_passwordResetConfirmSchema_accepts_matching_passwords", () => {
  const result = passwordResetConfirmSchema.safeParse({
    token: "reset-token-abc123",
    password: "NewPassword123",
    confirmPassword: "NewPassword123",
  });
  expect(result.success).toBeTrue();
});

test("test_passwordResetConfirmSchema_rejects_mismatched_passwords", () => {
  const result = passwordResetConfirmSchema.safeParse({
    token: "reset-token-abc123",
    password: "NewPassword123",
    confirmPassword: "DifferentPassword",
  });
  expect(result.success).toBeFalse();
});

test("test_passwordResetConfirmSchema_bilingual_mismatch_error", () => {
  const result = passwordResetConfirmSchema.safeParse({
    token: "reset-token-abc123",
    password: "NewPassword123",
    confirmPassword: "DifferentPassword",
  });
  if (result.success) throw new Error("Should have failed");
  const confirmError = result.error.issues.find(
    (i) => i.path[0] === "confirmPassword",
  );
  if (!confirmError) throw new Error("No confirmPassword error found");
  expect(
    confirmError.message.includes("không khớp") &&
      confirmError.message.includes("do not match"),
  ).toBeTrue();
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nResults: ${String(passed)} passed, ${String(failed)} failed`);
if (failed > 0) {
  process.exit(1);
}
