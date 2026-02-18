/**
 * Convex Better Auth Next.js SSR helpers.
 *
 * WHY: Server Components need a way to fetch Convex data with the user's
 * auth token. convexBetterAuthNextJs() provides:
 * - getToken: Get the current user's JWT for server-side Convex calls
 * - fetchAuthQuery/fetchAuthMutation: Fetch Convex data in Server Components
 * - preloadAuthQuery: Preload data for SSR hydration
 *
 * These helpers bridge the gap between Next.js server-side rendering and
 * Convex's real-time client-side subscriptions.
 *
 * NEXT_PUBLIC_CONVEX_SITE_URL format: https://<deployment>.convex.site
 * This is required for server-side token validation.
 */
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

import { env } from "~/env";

// Derive the Convex site URL from the deployment URL if not explicitly set.
// Convex site URL format: https://<deployment>.convex.site
// Convex URL format:      https://<deployment>.convex.cloud
// WHY: The site URL is used for server-side auth token validation. If not
// explicitly configured, we derive it from the deployment URL.
// NOTE: env vars may be undefined at build-time when CI=true and skipValidation
// is active. Guard with nullish coalescing to avoid ".replace is not a function".
const convexSiteUrl =
  env.NEXT_PUBLIC_CONVEX_SITE_URL ??
  env.NEXT_PUBLIC_CONVEX_URL?.replace(".convex.cloud", ".convex.site") ??
  "";

export const {
  getToken,
  handler,
  isAuthenticated,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
  preloadAuthQuery,
} = convexBetterAuthNextJs({
  convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
  convexSiteUrl,
});
