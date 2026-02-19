"use client";

import type { ReactNode } from "react";
import { useState, useMemo } from "react";

import type { NavItem } from "./nav-config";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { useServiceRequestNotifications } from "~/features/service-requests/hooks/use-service-request-notifications";

interface MobileNavControllerProps {
  children: ReactNode;
  navItems: NavItem[];
  orgName?: string;
  locale?: "vi" | "en";
}

/**
 * Client component that owns the mobile nav open/close state.
 *
 * WHY: Isolating useState here allows PortalLayout to be a Server Component.
 * The only client-side interactivity in the portal layout is the mobile nav
 * toggle, so this thin wrapper is the only piece that needs to be in the
 * client bundle. All portal page content remains server-rendered.
 */
export function MobileNavController({
  children,
  navItems,
  orgName,
  locale = "vi",
}: MobileNavControllerProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { totalBadge } = useServiceRequestNotifications();

  // Inject the notification badge onto the service-requests nav item when count > 0.
  // WHY: The badge must be computed client-side from live Convex data, so we
  // merge it here rather than hardcoding it in the static nav config.
  const navItemsWithBadge = useMemo<NavItem[]>(() => {
    return navItems.map((item) => {
      if (item.href.endsWith("/service-requests") && totalBadge > 0) {
        return { ...item, badge: String(totalBadge) };
      }
      return item;
    });
  }, [navItems, totalBadge]);

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar navItems={navItemsWithBadge} locale={locale} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          orgName={orgName}
          onMobileMenuOpen={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Mobile navigation sheet */}
      <MobileNav
        navItems={navItemsWithBadge}
        locale={locale}
        isOpen={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
      />
    </>
  );
}
