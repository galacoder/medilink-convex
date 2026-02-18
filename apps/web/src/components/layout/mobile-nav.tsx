"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@medilink/ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@medilink/ui/sheet";

import type { NavItem } from "./nav-config";

interface MobileNavProps {
  navItems: NavItem[];
  locale?: "vi" | "en";
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sheet-based mobile navigation for small screens.
 *
 * WHY: The desktop Sidebar is hidden on mobile (lg:hidden). MobileNav
 * provides the same navigation via a Sheet (drawer) triggered from the
 * Header's mobile menu button. Controlled via isOpen/onOpenChange from
 * the portal layout to coordinate open state between Header and MobileNav.
 */
export function MobileNav({
  navItems,
  locale = "vi",
  isOpen,
  onOpenChange,
}: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-left">MediLink</SheetTitle>
        </SheetHeader>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label[locale]}</span>
                {item.badge && (
                  <span className="bg-primary/20 ml-auto rounded-full px-2 py-0.5 text-xs font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
