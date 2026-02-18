/**
 * Type-level and runtime validation tests for organization validators.
 * These run via: node --import tsx packages/validators/src/organizations.test.ts
 * or are checked at typecheck time for type-safety assertions.
 */
import {
  createOrganizationSchema,
  memberRoleSchema,
  orgTypeSchema,
  platformRoleSchema,
  updateOrganizationSchema,
} from "./organizations";

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
  };
}

console.log("\norgTypeSchema:");
test("accepts 'hospital'", () => {
  expect(orgTypeSchema.safeParse("hospital").success).toBeTrue();
});
test("accepts 'provider'", () => {
  expect(orgTypeSchema.safeParse("provider").success).toBeTrue();
});
test("rejects invalid org_type", () => {
  expect(orgTypeSchema.safeParse("clinic").success).toBeFalse();
});

console.log("\nmemberRoleSchema:");
test("accepts 'owner'", () => {
  expect(memberRoleSchema.safeParse("owner").success).toBeTrue();
});
test("accepts 'admin'", () => {
  expect(memberRoleSchema.safeParse("admin").success).toBeTrue();
});
test("accepts 'member'", () => {
  expect(memberRoleSchema.safeParse("member").success).toBeTrue();
});
test("rejects 'superadmin'", () => {
  expect(memberRoleSchema.safeParse("superadmin").success).toBeFalse();
});

console.log("\nplatformRoleSchema:");
test("accepts 'platform_admin'", () => {
  expect(platformRoleSchema.safeParse("platform_admin").success).toBeTrue();
});
test("accepts 'platform_support'", () => {
  expect(platformRoleSchema.safeParse("platform_support").success).toBeTrue();
});
test("rejects invalid platform role", () => {
  expect(platformRoleSchema.safeParse("admin").success).toBeFalse();
});

console.log("\ncreateOrganizationSchema:");
test("accepts valid organization", () => {
  const result = createOrganizationSchema.safeParse({
    name: "SPMET Hospital",
    slug: "spmet-hospital",
    org_type: "hospital",
  });
  expect(result.success).toBeTrue();
});
test("rejects name shorter than 2 chars", () => {
  const result = createOrganizationSchema.safeParse({
    name: "A",
    slug: "spmet",
    org_type: "hospital",
  });
  expect(result.success).toBeFalse();
});
test("rejects slug with uppercase letters", () => {
  const result = createOrganizationSchema.safeParse({
    name: "SPMET",
    slug: "SPMET",
    org_type: "hospital",
  });
  expect(result.success).toBeFalse();
});
test("rejects slug with spaces", () => {
  const result = createOrganizationSchema.safeParse({
    name: "SPMET Hospital",
    slug: "spmet hospital",
    org_type: "hospital",
  });
  expect(result.success).toBeFalse();
});
test("accepts slug with hyphens and numbers", () => {
  const result = createOrganizationSchema.safeParse({
    name: "SPMET Hospital",
    slug: "spmet-2024",
    org_type: "provider",
  });
  expect(result.success).toBeTrue();
});
test("bilingual error message for short name", () => {
  const result = createOrganizationSchema.safeParse({
    name: "A",
    slug: "spmet",
    org_type: "hospital",
  });
  if (result.success) throw new Error("Should have failed");
  const nameError = result.error.issues.find((i) => i.path[0] === "name");
  if (!nameError) throw new Error("No name error found");
  expect(
    nameError.message.includes("ít nhất 2 ký tự") &&
      nameError.message.includes("at least 2 characters"),
  ).toBeTrue();
});

console.log("\nupdateOrganizationSchema:");
test("accepts empty object (all fields optional)", () => {
  expect(updateOrganizationSchema.safeParse({}).success).toBeTrue();
});
test("accepts partial update (name only)", () => {
  expect(
    updateOrganizationSchema.safeParse({ name: "New Name" }).success,
  ).toBeTrue();
});

// Summary
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
