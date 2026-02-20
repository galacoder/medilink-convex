"use client";

import type { ReactNode } from "react";

import type { NavItem } from "./nav-config";
import { MobileNavController } from "./mobile-nav-controller";

interface PortalLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  orgName?: string;
  locale?: "vi" | "en";
}

/**
 * Portal layout wrapper — composes Sidebar + Header + MobileNav.
 *
 * WHY: This is now a Server Component. The mobile nav open/close state has
 * been extracted into MobileNavController (client component), so only the
 * minimal interactive piece lives in the client bundle. Portal page children
 * remain server-rendered, reducing JS payload for all portal routes.
 */
export function PortalLayout({
  children,
  navItems,
  orgName,
  locale = "vi",
}: PortalLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <MobileNavController
        navItems={navItems}
        orgName={orgName}
        locale={locale}
      >
        {children}
      </MobileNavController>
    </div>
  );
}
