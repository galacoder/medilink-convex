import type { GenericCtx } from "@convex-dev/better-auth";
import type { BetterAuthOptions } from "better-auth/minimal";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { organization } from "better-auth/plugins";

import { components } from "./_generated/api";
import { type DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

/**
 * The Better Auth component client.
 * Provides methods for integrating Convex with Better Auth and
 * helper methods for auth-gated queries/mutations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authComponent = createClient<DataModel>(components.betterAuth as any);

/**
 * Creates the Better Auth options for a given Convex context.
 *
 * WHY: The auth instance is created per-request so each request gets the correct
 * Convex context for database operations. This is the Convex component model pattern.
 */
export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
  ({
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),

    // Email/password provider (AC-9)
    emailAndPassword: {
      enabled: true,
      // Email verification is optional in dev; enable in production
      requireEmailVerification: false,
    },

    // Organization plugin with org_type metadata (AC-2, AC-3, AC-4, AC-6)
    // Built-in roles: owner, admin, member match our schema
    plugins: [
      organization({
        // Allow creating organizations with org_type metadata
        allowUserToCreateOrganization: true,
        // Custom fields on organization (org_type for hospital/provider)
        organizationCreation: {
          disabled: false,
        },
      }),
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
          definePayload: ({
            user,
            session,
          }: {
            user: Record<string, unknown>;
            session: Record<string, unknown>;
          }) => ({
            // Active organization ID for org-scoped Convex queries
            organizationId: session.activeOrganizationId ?? null,
            // Platform-level role for platform admin access
            platformRole: user.platformRole ?? null,
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
