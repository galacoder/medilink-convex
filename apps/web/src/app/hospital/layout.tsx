"use client";

import type { ReactNode } from "react";

import { hospitalNavItems } from "~/components/layout/nav-config";
import { PortalLayout } from "~/components/layout/portal-layout";

/**
 * Hospital portal layout — wraps all /hospital/* pages with sidebar + header.
 *
 * WHY: All hospital routes share the same navigation structure.
 * Using a route group layout keeps hospital pages isolated from
 * provider and admin portals while sharing the PortalLayout component.
 */
export default function HospitalLayout({ children }: { children: ReactNode }) {
  return <PortalLayout navItems={hospitalNavItems}>{children}</PortalLayout>;
}
