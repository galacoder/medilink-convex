"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

import { env } from "~/env";

// Lazy singleton pattern -- client is created only when the component first
// mounts (client-side), never at module scope. This prevents the build error
// "No address provided to ConvexReactClient" that occurs during Next.js static
// page generation when NEXT_PUBLIC_CONVEX_URL is undefined during `next build`.
let convex: ConvexReactClient | null = null;
function getConvexClient(): ConvexReactClient {
  convex ??= new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);
  return convex;
}

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
  return (
    <ConvexProvider client={getConvexClient()}>{children}</ConvexProvider>
  );
}
