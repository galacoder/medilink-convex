import "server-only";

import { cache } from "react";

import { env } from "~/env";
import { getToken, isAuthenticated } from "~/lib/convex";

/**
 * Get the current authenticated session token for use in Server Components.
 *
 * WHY: With the Convex component model, auth state is managed via JWT tokens
 * rather than server-side session objects. This helper retrieves the token
 * for use in server-side Convex queries (via fetchAuthQuery/preloadAuthQuery).
 *
 * Cached with React's cache() so the token is only fetched once per request
 * even if multiple Server Components call getSession().
 */
export const getSession = cache(getToken);

/**
 * Check if the current request is from an authenticated user.
 */
export const isUserAuthenticated = cache(isAuthenticated);

/**
 * Auth API shim for server-side session retrieval.
 *
 * WHY: Server Components and API routes cannot call Convex directly — they need
 * the Better Auth session from the HTTP layer. This shim provides a getSession()
 * that fetches from the Better Auth API route.
 *
 * The auth route handler at /api/auth/[...all] is backed by the Convex
 * Better Auth component (see convex/auth.ts + apps/web/src/app/api/auth/[...all]/route.ts).
 */
export const auth = {
  api: {
    getSession: async ({ headers: reqHeaders }: { headers: Headers }) => {
      // Resolve base URL from environment (Vercel or local)
      const baseUrl =
        env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
          : env.VERCEL_ENV === "preview" && env.VERCEL_URL
            ? `https://${env.VERCEL_URL}`
            : "http://localhost:3000";

      try {
        const res = await fetch(`${baseUrl}/api/auth/get-session`, {
          headers: reqHeaders,
        });
        if (!res.ok) return null;
        const data = (await res.json()) as {
          user?: { id: string; name: string; email: string };
          session?: { id: string; userId: string };
        } | null;
        return data;
      } catch {
        return null;
      }
    },
  },
} as const;

export type AuthShim = typeof auth;
