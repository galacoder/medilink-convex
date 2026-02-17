import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * MediLink Convex base schema.
 *
 * Conventions (see CLAUDE.md):
 *  - Timestamps: v.number() (epoch ms)
 *  - Enums:      v.union(v.literal("a"), v.literal("b"))
 *  - Indexes:    by_<field> prefix
 *  - All tables: createdAt + updatedAt as v.number()
 */
export default defineSchema({
  /**
   * Organizations represent SPMET Healthcare School or any provider group.
   * org_type distinguishes between hospital facilities and equipment providers.
   */
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    // Bilingual label: vi: "Loại tổ chức" / en: "Organization type"
    org_type: v.union(v.literal("hospital"), v.literal("provider")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["org_type"])
    .index("by_slug", ["slug"]),

  /**
   * Links users to organizations with a specific role.
   * Supports multi-tenancy for future multi-school expansion.
   */
  organizationMemberships: defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"),
    // Bilingual label: vi: "Vai trò" / en: "Role"
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_org_and_user", ["orgId", "userId"]),

  /**
   * Platform-level users (students, staff, admins).
   * Organization-scoped roles are in organizationMemberships.
   * platformRole is reserved for super-admins who manage the platform itself.
   */
  users: defineTable({
    name: v.string(),
    email: v.string(),
    // Bilingual label: vi: "Vai trò nền tảng" / en: "Platform role"
    // Optional: only set for platform_admin or platform_support users
    platformRole: v.optional(
      v.union(
        v.literal("platform_admin"),
        v.literal("platform_support"),
      ),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});
