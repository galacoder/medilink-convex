"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@medilink/ui";
import { Button } from "@medilink/ui/button";
import { ScrollArea } from "@medilink/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@medilink/ui/tooltip";

import type { NavItem } from "./nav-config";

interface SidebarProps {
  navItems: NavItem[];
  locale?: "vi" | "en";
}

/**
 * Collapsible portal sidebar with icon + label navigation.
 *
 * WHY: All three portals (hospital, provider, admin) need a consistent
 * sidebar layout. Making it configurable via navItems allows the same
 * component to serve all portals without duplication.
 *
 * Uses TooltipProvider to show labels when collapsed for accessibility.
 */
export function Sidebar({ navItems, locale = "vi" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "bg-background hidden h-screen flex-col border-r transition-all duration-300 lg:flex",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo / Brand area */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-4",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          {!isCollapsed && (
            <span className="text-lg font-semibold tracking-tight">
              MediLink
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            className="h-8 w-8 shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation items */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "hover:bg-accent hover:text-accent-foreground flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                        aria-label={item.label[locale]}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label[locale]}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label[locale]}</span>
                  {item.badge && (
                    <span className="bg-primary/20 ml-auto rounded-full px-2 py-0.5 text-xs font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
