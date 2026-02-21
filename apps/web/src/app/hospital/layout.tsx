"use client";

import type { ReactNode } from "react";

import { hospitalNavItems } from "~/components/layout/nav-config";
import { PortalLayout } from "~/components/layout/portal-layout";
import { ConvexAuthGuard } from "~/components/providers/convex-auth-guard";

/**
 * Hospital portal layout — wraps all /hospital/* pages with sidebar + header.
 *
 * WHY: All hospital routes share the same navigation structure.
 * Using a route group layout keeps hospital pages isolated from
 * provider and admin portals while sharing the PortalLayout component.
 *
 * ConvexAuthGuard ensures no portal page renders until the Convex WebSocket
 * connection is authenticated, preventing UNAUTHENTICATED query errors on
 * first load when initialToken hasn't been hydrated yet.
 */
export default function HospitalLayout({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthGuard>
      <PortalLayout navItems={hospitalNavItems}>{children}</PortalLayout>
    </ConvexAuthGuard>
  );
}
