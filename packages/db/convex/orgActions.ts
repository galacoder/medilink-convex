/**
 * Custom organization creation for MediLink.
 *
 * WHY: @convex-dev/better-auth v0.10.10 does not support Better Auth's
 * organization plugin (it rejects the "member" model). We implement org
 * management directly using our custom Convex tables (organizations,
 * organizationMemberships, users).
 *
 * The flow (called from the Next.js API route /api/org/create):
 *   1. Auth-gated: verify the caller is authenticated
 *   2. Idempotency: skip if slug already exists
 *   3. Create org record in `organizations` table
 *   4. Create ownership membership in `organizationMemberships`
 *   5. Ensure a user record exists in our `users` table (may be first sign-in)
 *
 * After this mutation, the Next.js route calls Better Auth's updateUser API
 * to set activeOrganizationId + activeOrgType on the user record so that
 * the next JWT includes these in definePayload.
 *
 * vi: "Hành động tạo tổ chức" / en: "Organization creation actions"
 */
import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Create a new organization and make the calling user its owner.
 *
 * Returns the created organization's ID and slug, or throws if:
 *   - User is not authenticated
 *   - Slug is already taken
 */
export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    orgType: v.union(v.literal("hospital"), v.literal("provider")),
  },
  returns: v.object({
    orgId: v.string(),
    slug: v.string(),
  }),
  handler: async (ctx, args) => {
    // 1. Verify authentication
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError(
        "Bạn chưa đăng nhập (Not authenticated). Please sign in first.",
      );
    }

    const now = Date.now();

    // 2. Check slug uniqueness
    // WHY: .first() instead of .unique() — seed may create organizations before
    // the user signs up, so multiple code paths can write the same slug.
    // .unique() throws on duplicates; .first() returns the existing record safely.
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing !== null) {
      throw new ConvexError(
        `Slug "${args.slug}" đã được sử dụng (Slug already taken). Please choose a different name.`,
      );
    }

    // 3. Ensure user record exists in our custom users table.
    //    WHY: Users signing up via Better Auth don't automatically get a
    //    record in our business-layer `users` table. We create it here on
    //    first org creation if it doesn't already exist.
    // WHY: .first() instead of .unique() — seed may create a custom users record
    // before the user signs up via Better Auth. If both paths insert for the same
    // email, .unique() throws. .first() is already used in getUserContext for the
    // same reason.
    let userId = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .first()
      .then((u) => u?._id ?? null);

    if (userId === null) {
      userId = await ctx.db.insert("users", {
        name: authUser.name ?? authUser.email,
        email: authUser.email,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 4. Create the organization record
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      org_type: args.orgType,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // 5. Create the owner membership
    await ctx.db.insert("organizationMemberships", {
      orgId,
      userId,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });

    return { orgId: orgId.toString(), slug: args.slug };
  },
});
