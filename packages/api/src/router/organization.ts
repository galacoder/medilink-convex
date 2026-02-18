/**
 * tRPC organization router.
 *
 * WHY: Better Auth's organization plugin exposes invite operations via HTTP API
 * (not Convex mutations). This router bridges tRPC procedures to Better Auth's
 * organization management HTTP endpoints.
 *
 * Convex handles reactive data (members list, org settings) via queries.
 * This router handles non-reactive HTTP-based operations (invite, revoke).
 */
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { inviteMemberSchema } from "@medilink/validators";

import { protectedProcedure } from "../trpc";

/** Base URL for Better Auth API calls — falls back to localhost in development */
// WHY: process.env is not available in this tsconfig (no node types).
// The tRPC context is called server-side from Next.js, so the fetch target
// is the same origin. Using a relative URL (/api/auth) would also work,
// but an absolute URL is needed for server-side fetches.
// Callers should pass the base URL via the procedure context if needed.
const AUTH_BASE_URL = "http://localhost:3000";

export const organizationRouter = {
  /**
   * Invite a new member to the active organization.
   * Calls Better Auth's organization invite HTTP endpoint.
   *
   * Bilingual: vi: "Mời thành viên" / en: "Invite member"
   */
  inviteMember: protectedProcedure
    .input(inviteMemberSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Bạn chưa chọn tổ chức (No active organization selected)",
        });
      }

      const response = await ctx.authApi.getSession({
        headers: new Headers(),
      });

      if (!response?.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Better Auth organization invite is an HTTP-based operation
      // We call it via the auth API adapter's underlying fetch
      const result = await fetch(
        `${AUTH_BASE_URL}/api/auth/organization/invite-member`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: input.email,
            role: input.role,
            organizationId: ctx.organizationId,
          }),
        },
      );

      if (!result.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Không thể gửi lời mời đến ${input.email} (Failed to invite ${input.email})`,
        });
      }

      return {
        success: true,
        message: `Đã gửi lời mời đến ${input.email} (Invitation sent to ${input.email})`,
      };
    }),

  /**
   * List pending invitations for the active organization.
   *
   * Bilingual: vi: "Danh sách lời mời đang chờ" / en: "Pending invitations"
   */
  listPendingInvites: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      return { invitations: [] };
    }

    try {
      const response = await fetch(
        `${AUTH_BASE_URL}/api/auth/organization/invitations?organizationId=${ctx.organizationId}`,
        { method: "GET" },
      );

      if (!response.ok) {
        return { invitations: [] };
      }

      const data = (await response.json()) as {
        invitations?: Array<{
          id: string;
          email: string;
          role: string;
          status: string;
          expiresAt: string | null;
        }>;
      };

      return { invitations: data.invitations ?? [] };
    } catch {
      return { invitations: [] };
    }
  }),

  /**
   * Revoke a pending invitation.
   *
   * Bilingual: vi: "Thu hồi lời mời" / en: "Revoke invitation"
   */
  revokeInvite: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().min(1, {
          message: "ID lời mời không hợp lệ (Invalid invitation ID)",
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bạn chưa chọn tổ chức (No active organization selected)",
        });
      }

      const response = await fetch(
        `${AUTH_BASE_URL}/api/auth/organization/cancel-invitation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId: input.invitationId }),
        },
      );

      if (!response.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Không thể thu hồi lời mời (Failed to revoke invitation)",
        });
      }

      return {
        success: true,
        message: "Đã thu hồi lời mời (Invitation revoked)",
      };
    }),
} satisfies TRPCRouterRecord;
