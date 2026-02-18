import type { ReactNode } from "react";

import { adminNavItems } from "~/components/layout/nav-config";
import { PortalLayout } from "~/components/layout/portal-layout";

/**
 * Platform admin layout — wraps all /admin/* pages with sidebar + header.
 *
 * WHY: All platform admin routes share the same navigation structure.
 * Platform admins (SangLeTech staff) have their own isolated portal
 * with system-wide oversight capabilities (hospitals, providers, audit log).
 */
export default function PlatformAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PortalLayout navItems={adminNavItems}>{children}</PortalLayout>;
}
