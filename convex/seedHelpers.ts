/**
 * Seed helpers: Idempotency guard functions
 * vi: "Hàm trợ giúp seed: Kiểm tra tồn tại trước khi chèn"
 * en: "Seed helpers: Existence checks before insertion"
 *
 * Each helper returns the existing ID (if found) or null (if not found).
 * The seed orchestrator uses these to skip insertion when data already exists,
 * making the seed safe to run multiple times without creating duplicates.
 */

import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Find an organization by its unique slug.
 * Uses the by_slug index for efficient lookup.
 *
 * vi: "Tìm tổ chức theo slug" / en: "Find organization by slug"
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
 * Find a user by email address.
 * Users table has no email index, so we use a filter scan.
 *
 * vi: "Tìm người dùng theo email" / en: "Find user by email"
 */
export async function findUserByEmail(
  ctx: MutationCtx,
  email: string,
): Promise<Id<"users"> | null> {
  const user = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("email"), email))
    .first();
  return user?._id ?? null;
}

/**
 * Find equipment by serial number within an organization.
 * Uses the by_org_and_serialNumber index for efficient lookup.
 *
 * vi: "Tìm thiết bị theo số serial trong tổ chức"
 * en: "Find equipment by serial number within organization"
 */
export async function findEquipmentBySerial(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  serialNumber: string,
): Promise<Id<"equipment"> | null> {
  const equipment = await ctx.db
    .query("equipment")
    .withIndex("by_org_and_serialNumber", (q) =>
      q.eq("organizationId", orgId).eq("serialNumber", serialNumber),
    )
    .first();
  return equipment?._id ?? null;
}

/**
 * Find a QR code by its unique code string.
 * Uses the by_code index for efficient lookup.
 *
 * vi: "Tìm mã QR theo giá trị code" / en: "Find QR code by code value"
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
 * Find an organization membership by org + user combination.
 * Uses the by_org_and_user index for efficient lookup.
 *
 * vi: "Tìm thành viên tổ chức theo org và user"
 * en: "Find organization membership by org and user"
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
 * Uses the by_org index then filters by nameEn for idempotency.
 *
 * vi: "Tìm danh mục thiết bị theo tên tiếng Anh trong tổ chức"
 * en: "Find equipment category by English name within organization"
 */
export async function findCategoryByName(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  nameEn: string,
): Promise<Id<"equipmentCategories"> | null> {
  const category = await ctx.db
    .query("equipmentCategories")
    .withIndex("by_org", (q) => q.eq("organizationId", orgId))
    .filter((q) => q.eq(q.field("nameEn"), nameEn))
    .first();
  return category?._id ?? null;
}

/**
 * Find the provider record for a given organization.
 * Uses the by_org index since each provider org has one provider record.
 *
 * vi: "Tìm hồ sơ nhà cung cấp theo tổ chức"
 * en: "Find provider record by organization"
 */
export async function findProviderByOrg(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
): Promise<Id<"providers"> | null> {
  const provider = await ctx.db
    .query("providers")
    .withIndex("by_org", (q) => q.eq("organizationId", orgId))
    .first();
  return provider?._id ?? null;
}

/**
 * Find a consumable by English name within an organization.
 * Uses the by_org index then filters by nameEn for idempotency.
 *
 * vi: "Tìm vật tư tiêu hao theo tên tiếng Anh trong tổ chức"
 * en: "Find consumable by English name within organization"
 */
export async function findConsumableByName(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  nameEn: string,
): Promise<Id<"consumables"> | null> {
  const consumable = await ctx.db
    .query("consumables")
    .withIndex("by_org", (q) => q.eq("organizationId", orgId))
    .filter((q) => q.eq(q.field("nameEn"), nameEn))
    .first();
  return consumable?._id ?? null;
}
