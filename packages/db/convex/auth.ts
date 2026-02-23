import type { GenericCtx } from "@convex-dev/better-auth";
import type { BetterAuthOptions } from "better-auth/minimal";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";

import { components } from "./_generated/api";
import { type DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

/**
 * Trusted origins for Better Auth CORS validation.
 *
 * WHY: Dev server port varies by environment (3000 default, but homelab uses 3002,
 * and port conflicts may cause Next.js to auto-increment). Explicitly trusting all
 * localhost ports prevents MISSING_OR_NULL_ORIGIN errors when SITE_URL env var
 * doesn't match the actual running port.
 *
 * Production: SITE_URL is set to the production domain so only that domain is trusted.
 */
// WHY: Convex always runs NODE_ENV="production" and CONVEX_DEPLOYMENT is a local
// CLI variable not available in the function runtime. Instead, detect production
// via SITE_URL: in dev it's unset (defaults to localhost); in production it's
// explicitly set to the production domain via `npx convex env set SITE_URL`.
const isProduction =
  !!process.env.SITE_URL &&
  !process.env.SITE_URL.startsWith("http://localhost");

const trustedOrigins = isProduction
  ? [siteUrl]
  : [
      siteUrl,
      // localhost ports 3000-3006 (Next.js auto-increments past occupied ports)
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://localhost:3005",
      "http://localhost:3006",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3002",
      "http://127.0.0.1:3005",
      // homelab LAN access (192.168.2.18)
      "http://192.168.2.18:3000",
      "http://192.168.2.18:3001",
      "http://192.168.2.18:3002",
      "http://192.168.2.18:3003",
      "http://192.168.2.18:3004",
      "http://192.168.2.18:3005",
      "http://192.168.2.18:3006",
    ];

/**
 * The Better Auth component client.
 * Provides methods for integrating Convex with Better Auth and
 * helper methods for auth-gated queries/mutations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authComponent = createClient<DataModel>(
  components.betterAuth as any,
);

/**
 * Creates the Better Auth options for a given Convex context.
 *
 * WHY: The auth instance is created per-request so each request gets the correct
 * Convex context for database operations. This is the Convex component model pattern.
 *
 * NOTE: We do NOT use Better Auth's `organization()` plugin because
 * @convex-dev/better-auth v0.10.10 does not support the "member"/"organization"
 * models required by that plugin (ArgumentValidationError on org creation).
 * Instead, org management lives entirely in our custom Convex tables
 * (organizations, organizationMemberships) and org context is stored as
 * user-level additionalFields (activeOrganizationId, activeOrgType).
 */
export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
  ({
    baseURL: siteUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),

    // Email/password provider (AC-9)
    emailAndPassword: {
      enabled: true,
      // Email verification is optional in dev; enable in production
      requireEmailVerification: false,
    },

    // Custom user fields for org context (replaces Better Auth org plugin).
    // WHY: The JWT definePayload below reads these to enrich Convex tokens
    // so queries can scope data to the user's active org without extra lookups.
    // Note: Better Auth's DBFieldAttribute uses `required: false` + `defaultValue: null`
    // for nullable strings (the `nullable` property doesn't exist in this version).
    user: {
      additionalFields: {
        activeOrganizationId: {
          type: "string" as const,
          required: false,
          // No defaultValue — prevents null insertion on user creation
          // (Convex component schema rejects unknown fields)
          // Routing handled via medilink-org-context cookie instead
        },
        activeOrgType: {
          // "hospital" | "provider" — drives proxy.ts portal routing
          type: "string" as const,
          required: false,
        },
        platformRole: {
          // "platform_admin" | "platform_support" — for SangLeTech staff
          type: "string" as const,
          required: false,
        },
      },
    },

    plugins: [
      // Convex plugin (required for Convex compatibility) - generates JWTs for Convex
      // Custom JWT payload includes session enrichment fields (AC-7)
      convex({
        authConfig,
        jwt: {
          // 15-minute JWT expiration (short for security)
          expirationSeconds: 60 * 15,
          // Include organization context in the JWT payload.
          // WHY: This allows Convex queries to access organizationId, orgRole,
          // and platformRole without additional database lookups per request.
          // These come from user.additionalFields (set at org-creation time).
          definePayload: ({
            user,
          }: {
            user: Record<string, unknown>;
            session: Record<string, unknown>;
          }) => ({
            // Email included for DB fallback lookups in requireOrgAuth / requirePlatformAdmin.
            // WHY: The Better Auth Convex component schema cannot store custom additionalFields
            // (platformRole, activeOrganizationId, activeOrgType). When these are null, Convex
            // query helpers fall back to looking up the user in our custom `users` table by email.
            email: (user.email as string) ?? null,
            // Active organization ID for org-scoped Convex queries
            organizationId: (user.activeOrganizationId as string) ?? null,
            // Organization type for portal routing validation
            orgType: (user.activeOrgType as string) ?? null,
            // Platform-level role for platform admin access
            platformRole: (user.platformRole as string) ?? null,
          }),
        },
      }),
    ],
  }) satisfies BetterAuthOptions;

/**
 * Creates a Better Auth instance for the given Convex context.
 * Used in the API route handler.
 */
export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth(createAuthOptions(ctx));

/**
 * Convex query to get the currently authenticated user.
 * Returns null if the user is not authenticated.
 *
 * WHY: Provides a reusable pattern for auth-gated queries
 * via the Convex component's getAuthUser helper.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
