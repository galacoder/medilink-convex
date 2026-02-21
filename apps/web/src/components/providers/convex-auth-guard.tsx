"use client";

import { useConvexAuth } from "convex/react";

/**
 * Guards portal pages from rendering until the Convex WebSocket connection
 * is authenticated.
 *
 * WHY: useQuery hooks fire immediately on mount. When initialToken is null
 * (e.g., first load after sign-in before the SSR token is available),
 * ConvexBetterAuthProvider enters an async token-fetch cycle. Any Convex
 * query fired during that window throws UNAUTHENTICATED. This guard holds
 * rendering until isAuthenticated=true, preventing the race condition
 * across all 30+ feature hooks on portal pages — without touching each
 * individual hook.
 *
 * When initialToken IS present (normal case), useConvexAuth() resolves
 * synchronously so isLoading=false immediately — no visible flash.
 */
export function ConvexAuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
