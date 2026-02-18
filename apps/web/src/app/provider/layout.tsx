import type { ReactNode } from "react";

import { PortalLayout } from "~/components/layout/portal-layout";
import { providerNavItems } from "~/components/layout/nav-config";

/**
 * Provider portal layout — wraps all /provider/* pages with sidebar + header.
 *
 * WHY: All provider routes share the same navigation structure.
 * Using a route group layout keeps provider pages isolated from
 * hospital and admin portals while sharing the PortalLayout component.
 */
export default function ProviderLayout({ children }: { children: ReactNode }) {
  return (
    <PortalLayout navItems={providerNavItems}>
      {children}
    </PortalLayout>
  );
}
