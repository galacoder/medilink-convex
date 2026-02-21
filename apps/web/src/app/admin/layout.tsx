"use client";

import type { ReactNode } from "react";

import { adminNavItems } from "~/components/layout/nav-config";
import { PortalLayout } from "~/components/layout/portal-layout";
import { ConvexAuthGuard } from "~/components/providers/convex-auth-guard";

/**
 * Platform admin layout — wraps all /admin/* pages with sidebar + header.
 *
 * WHY: All platform admin routes share the same navigation structure.
 * Platform admins (SangLeTech staff) have their own isolated portal
 * with system-wide oversight capabilities (hospitals, providers, audit log).
 *
 * ConvexAuthGuard prevents UNAUTHENTICATED query errors on first load.
 * See ConvexAuthGuard for full explanation.
 */
export default function PlatformAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexAuthGuard>
      <PortalLayout navItems={adminNavItems}>{children}</PortalLayout>
    </ConvexAuthGuard>
  );
}
