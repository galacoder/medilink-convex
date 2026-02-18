"use client";

import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

import { env } from "~/env";

let convex: ConvexReactClient | null = null;

function getConvexClient(url: string): ConvexReactClient {
  convex ??= new ConvexReactClient(url);
  return convex;
}

/**
 * Provides Convex real-time database access to all child components.
 *
 * During CI builds (when NEXT_PUBLIC_CONVEX_URL is unset and env validation
 * is skipped), renders children without Convex so `next build` succeeds.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // env.NEXT_PUBLIC_CONVEX_URL is undefined during CI builds (skipValidation)
  const url = env.NEXT_PUBLIC_CONVEX_URL as string | undefined;
  if (!url) {
    return <>{children}</>;
  }
  return (
    <ConvexProvider client={getConvexClient(url)}>{children}</ConvexProvider>
  );
}
