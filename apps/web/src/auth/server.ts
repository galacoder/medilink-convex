import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { env } from "~/env";
import { getToken } from "~/lib/convex";

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
export const getSession = cache(async () => {
  const token = await getToken();
  return token ?? null;
});

/**
 * Check if the current request is from an authenticated user.
 */
export const isUserAuthenticated = cache(async (): Promise<boolean> => {
  const token = await getToken();
  return token !== null;
});

/**
 * Auth API shim for backward compatibility with tRPC context.
 *
 * WHY: The tRPC context (packages/api/src/trpc.ts) expects an auth instance
 * with auth.api.getSession(). With the Convex component model, the real auth
 * instance lives in convex/auth.ts (per-request). This shim provides a
 * getSession() that fetches from the Better Auth API route.
 *
 * The auth route handler at /api/auth/[...all] is backed by the Convex
 * Better Auth component (see convex/auth.ts + apps/web/src/app/api/auth/[...all]/route.ts).
 *
 * TODO (M1-2): Update tRPC context to use Convex-native session retrieval
 * directly (via getToken() + Convex fetchAuthQuery) instead of this HTTP shim.
 */
export const auth = {
  api: {
    getSession: async ({ headers: reqHeaders }: { headers: Headers }) => {
      // Resolve base URL from environment (Vercel or local)
      const baseUrl =
        typeof env.VERCEL_PROJECT_PRODUCTION_URL === "string" &&
        env.VERCEL_ENV === "production"
          ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
          : typeof env.VERCEL_URL === "string" && env.VERCEL_ENV === "preview"
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
