/**
 * Type-level and runtime validation tests for organization validators.
 * Runs via Vitest: pnpm test (from packages/validators or repo root)
 */
import { describe, expect, it } from "vitest";

import {
  createOrganizationSchema,
  memberRoleSchema,
  orgTypeSchema,
  platformRoleSchema,
  updateOrganizationSchema,
} from "./organizations";

describe("orgTypeSchema", () => {
  it("accepts 'hospital'", () => {
    expect(orgTypeSchema.safeParse("hospital").success).toBe(true);
  });
  it("accepts 'provider'", () => {
    expect(orgTypeSchema.safeParse("provider").success).toBe(true);
  });
  it("rejects invalid org_type", () => {
    expect(orgTypeSchema.safeParse("clinic").success).toBe(false);
  });
});

describe("memberRoleSchema", () => {
  it("accepts 'owner'", () => {
    expect(memberRoleSchema.safeParse("owner").success).toBe(true);
  });
  it("accepts 'admin'", () => {
    expect(memberRoleSchema.safeParse("admin").success).toBe(true);
  });
  it("accepts 'member'", () => {
    expect(memberRoleSchema.safeParse("member").success).toBe(true);
  });
  it("rejects 'superadmin'", () => {
    expect(memberRoleSchema.safeParse("superadmin").success).toBe(false);
  });
});

describe("platformRoleSchema", () => {
  it("accepts 'platform_admin'", () => {
    expect(platformRoleSchema.safeParse("platform_admin").success).toBe(true);
  });
  it("accepts 'platform_support'", () => {
    expect(platformRoleSchema.safeParse("platform_support").success).toBe(true);
  });
  it("rejects invalid platform role", () => {
    expect(platformRoleSchema.safeParse("admin").success).toBe(false);
  });
});

describe("createOrganizationSchema", () => {
  it("accepts valid organization", () => {
    const result = createOrganizationSchema.safeParse({
      name: "SPMET Hospital",
      slug: "spmet-hospital",
      org_type: "hospital",
    });
    expect(result.success).toBe(true);
  });
  it("rejects name shorter than 2 chars", () => {
    const result = createOrganizationSchema.safeParse({
      name: "A",
      slug: "spmet",
      org_type: "hospital",
    });
    expect(result.success).toBe(false);
  });
  it("rejects slug with uppercase letters", () => {
    const result = createOrganizationSchema.safeParse({
      name: "SPMET",
      slug: "SPMET",
      org_type: "hospital",
    });
    expect(result.success).toBe(false);
  });
  it("rejects slug with spaces", () => {
    const result = createOrganizationSchema.safeParse({
      name: "SPMET Hospital",
      slug: "spmet hospital",
      org_type: "hospital",
    });
    expect(result.success).toBe(false);
  });
  it("accepts slug with hyphens and numbers", () => {
    const result = createOrganizationSchema.safeParse({
      name: "SPMET Hospital",
      slug: "spmet-2024",
      org_type: "provider",
    });
    expect(result.success).toBe(true);
  });
  it("bilingual error message for short name", () => {
    const result = createOrganizationSchema.safeParse({
      name: "A",
      slug: "spmet",
      org_type: "hospital",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === "name");
      expect(nameError).toBeDefined();
      expect(
        nameError!.message.includes("ít nhất 2 ký tự") &&
          nameError!.message.includes("at least 2 characters"),
      ).toBe(true);
    }
  });
});

describe("updateOrganizationSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateOrganizationSchema.safeParse({}).success).toBe(true);
  });
  it("accepts partial update (name only)", () => {
    expect(
      updateOrganizationSchema.safeParse({ name: "New Name" }).success,
    ).toBe(true);
  });
});
