/**
 * Idempotency helper functions for seed.ts
 * vi: "Các hàm trợ giúp kiểm tra tồn tại cho seed.ts"
 * en: "Existence-check helper functions for seed.ts"
 *
 * Each helper returns the ID of an existing record, or null if not found.
 * All helpers use index-based lookups (not filter) for O(log n) performance.
 */

import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

/**
 * Find a user by email address.
 * Uses by_email index for O(log n) lookup.
 */
export async function findUserByEmail(
  ctx: MutationCtx,
  email: string,
): Promise<Id<"users"> | null> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
  return user?._id ?? null;
}

/**
 * Find an organization by slug.
 * Uses by_slug index for O(log n) lookup.
 */
export async function findOrgBySlug(
  ctx: MutationCtx,
  slug: string,
): Promise<Id<"organizations"> | null> {
  const org = await ctx.db
    .query("organizations")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();
  return org?._id ?? null;
}

/**
 * Find an organization membership by orgId + userId.
 * Uses by_org_and_user compound index for O(log n) lookup.
 */
export async function findMembership(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  userId: Id<"users">,
): Promise<Id<"organizationMemberships"> | null> {
  const membership = await ctx.db
    .query("organizationMemberships")
    .withIndex("by_org_and_user", (q) =>
      q.eq("orgId", orgId).eq("userId", userId),
    )
    .first();
  return membership?._id ?? null;
}

/**
 * Find an equipment category by English name within an organization.
 * Uses by_org index then filters by nameEn.
 *
 * WHY: No compound index on [organizationId, nameEn] — filter on by_org is
 * acceptable here since category counts per org are small (< 20 records).
 */
export async function findCategoryByName(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  nameEn: string,
): Promise<Id<"equipmentCategories"> | null> {
  const category = await ctx.db
    .query("equipmentCategories")
    .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
    .filter((q) => q.eq(q.field("nameEn"), nameEn))
    .first();
  return category?._id ?? null;
}

/**
 * Find equipment by serial number within an organization.
 * Uses by_org_and_serialNumber compound index for O(log n) lookup.
 */
export async function findEquipmentBySerial(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  serialNumber: string,
): Promise<Id<"equipment"> | null> {
  const equip = await ctx.db
    .query("equipment")
    .withIndex("by_org_and_serialNumber", (q) =>
      q.eq("organizationId", organizationId).eq("serialNumber", serialNumber),
    )
    .first();
  return equip?._id ?? null;
}

/**
 * Find a QR code by its unique code string.
 * Uses by_code index for O(log n) lookup.
 */
export async function findQrByCode(
  ctx: MutationCtx,
  code: string,
): Promise<Id<"qrCodes"> | null> {
  const qr = await ctx.db
    .query("qrCodes")
    .withIndex("by_code", (q) => q.eq("code", code))
    .first();
  return qr?._id ?? null;
}

/**
 * Find a consumable by English name within an organization.
 * Uses by_org index then filters by nameEn.
 *
 * WHY: No compound index on [organizationId, nameEn] — filter on by_org is
 * acceptable here since consumable counts per org are small (< 100 records).
 */
export async function findConsumableByName(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  nameEn: string,
): Promise<Id<"consumables"> | null> {
  const consumable = await ctx.db
    .query("consumables")
    .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
    .filter((q) => q.eq(q.field("nameEn"), nameEn))
    .first();
  return consumable?._id ?? null;
}

/**
 * Find a provider record by organization ID.
 * Uses by_org index for O(log n) lookup.
 */
export async function findProviderByOrg(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
): Promise<Id<"providers"> | null> {
  const provider = await ctx.db
    .query("providers")
    .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
    .first();
  return provider?._id ?? null;
}
