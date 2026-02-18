/**
 * Type-level and runtime validation tests for organization validators.
 * Runs via Vitest: pnpm test (from packages/validators or repo root)
 */
import { describe, expect, it } from "vitest";

import {
  createOrganizationSchema,
  inviteMemberSchema,
  memberRoleSchema,
  orgTypeSchema,
  platformRoleSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
  updateOrgSettingsSchema,
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
      if (nameError) {
        expect(
          nameError.message.includes("ít nhất 2 ký tự") &&
            nameError.message.includes("at least 2 characters"),
        ).toBe(true);
      }
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

// ---------------------------------------------------------------------------
// inviteMemberSchema
// ---------------------------------------------------------------------------

describe("inviteMemberSchema", () => {
  it("accepts valid email and admin role", () => {
    const result = inviteMemberSchema.safeParse({
      email: "staff@hospital.vn",
      role: "admin",
    });
    expect(result.success).toBe(true);
  });

  it("accepts member role", () => {
    const result = inviteMemberSchema.safeParse({
      email: "member@hospital.vn",
      role: "member",
    });
    expect(result.success).toBe(true);
  });

  it("rejects owner role (cannot invite as owner)", () => {
    const result = inviteMemberSchema.safeParse({
      email: "owner@hospital.vn",
      role: "owner",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format with bilingual message", () => {
    const result = inviteMemberSchema.safeParse({
      email: "not-an-email",
      role: "member",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "";
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it("rejects missing email", () => {
    expect(inviteMemberSchema.safeParse({ role: "member" }).success).toBe(
      false,
    );
  });

  it("rejects missing role", () => {
    expect(
      inviteMemberSchema.safeParse({ email: "staff@hospital.vn" }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateMemberRoleSchema
// ---------------------------------------------------------------------------

describe("updateMemberRoleSchema", () => {
  it("accepts valid userId and admin role", () => {
    const result = updateMemberRoleSchema.safeParse({
      userId: "user_abc123",
      role: "admin",
    });
    expect(result.success).toBe(true);
  });

  it("accepts member role", () => {
    const result = updateMemberRoleSchema.safeParse({
      userId: "user_abc123",
      role: "member",
    });
    expect(result.success).toBe(true);
  });

  it("accepts owner role (owner can assign other owners)", () => {
    const result = updateMemberRoleSchema.safeParse({
      userId: "user_abc123",
      role: "owner",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty userId with bilingual message", () => {
    const result = updateMemberRoleSchema.safeParse({
      userId: "",
      role: "admin",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "";
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid role", () => {
    const result = updateMemberRoleSchema.safeParse({
      userId: "user_abc123",
      role: "superuser",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// removeMemberSchema
// ---------------------------------------------------------------------------

describe("removeMemberSchema", () => {
  it("accepts valid userId", () => {
    const result = removeMemberSchema.safeParse({ userId: "user_abc123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty userId with bilingual message", () => {
    const result = removeMemberSchema.safeParse({ userId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "";
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it("rejects missing userId", () => {
    expect(removeMemberSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateOrgSettingsSchema
// ---------------------------------------------------------------------------

describe("updateOrgSettingsSchema", () => {
  it("accepts empty object (all optional)", () => {
    expect(updateOrgSettingsSchema.safeParse({}).success).toBe(true);
  });

  it("accepts name-only update", () => {
    expect(
      updateOrgSettingsSchema.safeParse({ name: "Bệnh viện Thủ Đức" }).success,
    ).toBe(true);
  });

  it("accepts slug-only update", () => {
    expect(
      updateOrgSettingsSchema.safeParse({ slug: "thu-duc-hospital" }).success,
    ).toBe(true);
  });

  it("accepts full settings update", () => {
    const result = updateOrgSettingsSchema.safeParse({
      name: "Bệnh viện Thủ Đức",
      slug: "thu-duc-hospital",
      contactEmail: "contact@thuduc.vn",
      contactPhone: "0901234567",
      address: "Quận 9, TP.HCM",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters with bilingual message", () => {
    const result = updateOrgSettingsSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "";
      expect(message).toMatch(/ký tự|characters/i);
    }
  });

  it("rejects invalid slug format", () => {
    const result = updateOrgSettingsSchema.safeParse({
      slug: "Invalid Slug With Spaces",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid contactEmail format", () => {
    const result = updateOrgSettingsSchema.safeParse({
      contactEmail: "not-valid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "";
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
