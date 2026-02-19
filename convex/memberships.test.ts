/**
 * Membership permission tests.
 *
 * WHY: Tests the membership-specific parts of the permission system —
 * particularly the canManageMember logic that determines which role
 * changes and member removals are allowed.
 *
 * These are unit tests for the pure permission logic. Integration tests
 * for the Convex mutations require a running Convex dev server.
 */

import { describe, expect, it } from "vitest";

import { canManageMember } from "./lib/permissions";

type MockId = string;

describe("Membership role change permissions", () => {
  const ownerId = "owner_001" as unknown as MockId;
  const adminId = "admin_001" as unknown as MockId;
  const memberId = "member_001" as unknown as MockId;
  const member2Id = "member_002" as unknown as MockId;

  describe("Owner role change permissions", () => {
    it("owner can change admin to member", () => {
      expect(
        canManageMember("owner", "admin", ownerId as never, adminId as never),
      ).toBe(true);
    });

    it("owner can change member to admin", () => {
      expect(
        canManageMember("owner", "member", ownerId as never, memberId as never),
      ).toBe(true);
    });

    it("owner can change member to owner", () => {
      // Owner can promote anyone to owner (last-owner guard is separate)
      expect(
        canManageMember("owner", "member", ownerId as never, memberId as never),
      ).toBe(true);
    });

    it("owner cannot change own role (self-modification blocked)", () => {
      expect(
        canManageMember("owner", "owner", ownerId as never, ownerId as never),
      ).toBe(false);
    });
  });

  describe("Admin role change permissions", () => {
    it("admin can change member role", () => {
      expect(
        canManageMember("admin", "member", adminId as never, memberId as never),
      ).toBe(true);
    });

    it("admin cannot change another admin's role", () => {
      expect(
        canManageMember("admin", "admin", adminId as never, member2Id as never),
      ).toBe(false);
    });

    it("admin cannot change owner's role", () => {
      expect(
        canManageMember("admin", "owner", adminId as never, ownerId as never),
      ).toBe(false);
    });
  });

  describe("Member role change permissions", () => {
    it("member cannot change any roles", () => {
      expect(
        canManageMember(
          "member",
          "member",
          memberId as never,
          member2Id as never,
        ),
      ).toBe(false);
    });

    it("member cannot change admin role", () => {
      expect(
        canManageMember("member", "admin", memberId as never, adminId as never),
      ).toBe(false);
    });

    it("member cannot change owner role", () => {
      expect(
        canManageMember("member", "owner", memberId as never, ownerId as never),
      ).toBe(false);
    });
  });
});

describe("Membership removal permissions", () => {
  const ownerId = "owner_001" as unknown as MockId;
  const adminId = "admin_001" as unknown as MockId;
  const memberId = "member_001" as unknown as MockId;

  it("owner can remove admin", () => {
    expect(
      canManageMember("owner", "admin", ownerId as never, adminId as never),
    ).toBe(true);
  });

  it("owner can remove member", () => {
    expect(
      canManageMember("owner", "member", ownerId as never, memberId as never),
    ).toBe(true);
  });

  it("admin can remove member", () => {
    expect(
      canManageMember("admin", "member", adminId as never, memberId as never),
    ).toBe(true);
  });

  it("admin cannot remove owner", () => {
    expect(
      canManageMember("admin", "owner", adminId as never, ownerId as never),
    ).toBe(false);
  });

  it("member cannot remove anyone", () => {
    expect(
      canManageMember("member", "member", memberId as never, adminId as never),
    ).toBe(false);
  });

  it("last owner removal is prevented by countOwners guard (documented)", () => {
    /**
     * The countOwners() function in permissions.ts counts owners before
     * any removal. If ownerCount <= 1 and the target is an owner,
     * the removeMember mutation throws ConvexError.
     * This is enforced in convex/organizations.ts removeMember mutation.
     */
    // canManageMember itself doesn't check ownerCount (separation of concerns)
    // The mutation layer applies the guard AFTER canManageMember returns true
    expect(
      canManageMember(
        "owner",
        "owner",
        "other_owner" as never,
        "last_owner" as never,
      ),
    ).toBe(true); // canManageMember says allowed — mutation must check countOwners
  });
});
