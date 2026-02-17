"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

import { env } from "~/env";

// Create a singleton ConvexReactClient instance for the browser.
// This is intentionally created at module scope so the same WebSocket
// connection is reused across re-renders (same pattern as tRPC query client).
const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Provides Convex real-time database access to all child components.
 *
 * Wraps children with ConvexProvider so any component in the tree can use:
 *   - useQuery() for real-time subscriptions
 *   - useMutation() for database writes
 *   - useAction() for external API calls
 */
export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
