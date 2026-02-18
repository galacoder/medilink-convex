"use client";

import type { ReactNode } from "react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";

import { authClient } from "~/auth/client";
import { env } from "~/env";

/**
 * Lazy singleton Convex client.
 * WHY: Using a singleton prevents creating multiple WebSocket connections
 * when the provider re-renders. The CI guard prevents errors when
 * NEXT_PUBLIC_CONVEX_URL is not set during builds.
 */
let convex: ConvexReactClient | null = null;

function getConvexClient(url: string): ConvexReactClient {
  convex ??= new ConvexReactClient(url);
  return convex;
}

/**
 * Provides Convex real-time database access and Better Auth session
 * to all child components.
 *
 * WHY: ConvexBetterAuthProvider replaces the standard ConvexProvider
 * to sync Better Auth session tokens with Convex's authentication system.
 * Without this, authenticated Convex queries would fail because Convex
 * would not receive the JWT token needed to identify the user.
 *
 * During CI builds (when NEXT_PUBLIC_CONVEX_URL is unset and env validation
 * is skipped), renders children without Convex so `next build` succeeds.
 */
export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: ReactNode;
  initialToken?: string | null;
}) {
  // env.NEXT_PUBLIC_CONVEX_URL is undefined during CI builds (skipValidation)
  const url = env.NEXT_PUBLIC_CONVEX_URL as string | undefined;
  if (!url) {
    return <>{children}</>;
  }
  return (
    <ConvexBetterAuthProvider
      client={getConvexClient(url)}
      authClient={authClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
