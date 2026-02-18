"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import type { NavItem } from "./nav-config";

interface PortalLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  orgName?: string;
  locale?: "vi" | "en";
}

/**
 * Portal layout wrapper — composes Sidebar + Header + MobileNav.
 *
 * WHY: This client component manages the mobile nav open/close state
 * that needs to be shared between Header (trigger) and MobileNav (sheet).
 * Keeping state here avoids prop drilling through server components and
 * lets the portal layout.tsx files stay as Server Components.
 */
export function PortalLayout({
  children,
  navItems,
  orgName,
  locale = "vi",
}: PortalLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar navItems={navItems} locale={locale} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          orgName={orgName}
          navItems={navItems}
          onMobileMenuOpen={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Mobile navigation sheet */}
      <MobileNav
        navItems={navItems}
        locale={locale}
        isOpen={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
      />
    </div>
  );
}
