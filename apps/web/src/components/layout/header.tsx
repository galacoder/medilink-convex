"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@medilink/ui/avatar";
import { Button } from "@medilink/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@medilink/ui/dropdown-menu";
import { ThemeToggle } from "@medilink/ui/theme";

import { signOut, useSession } from "~/auth/client";
import { NotificationCenter } from "~/components/notification-center";
import { OrgSwitcher } from "~/components/org-switcher";

interface HeaderProps {
  orgName?: string;
  onMobileMenuOpen?: () => void;
}

/**
 * Portal top header — shows org name, user menu, and mobile nav trigger.
 *
 * WHY: Each portal shares the same header structure. The header provides
 * org context (which organization the user belongs to) and user actions
 * (settings, sign-out). Mobile users trigger the Sheet-based MobileNav
 * via the onMobileMenuOpen callback.
 */
/**
 * Derives the settings page path from the current portal URL.
 * WHY: The header is shared across hospital, provider, and admin portals.
 * The settings link must point to the correct portal's settings page.
 */
function getSettingsPath(pathname: string): string {
  if (pathname.startsWith("/hospital")) return "/hospital/settings";
  if (pathname.startsWith("/provider")) return "/provider/settings";
  if (pathname.startsWith("/admin")) return "/admin/settings";
  return "/settings";
}

export function Header({ orgName: _orgName, onMobileMenuOpen }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const settingsPath = getSettingsPath(pathname);

  const user = session?.user;
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <header className="bg-background flex h-16 shrink-0 items-center gap-4 border-b px-6">
      {/* Mobile menu trigger — visible only on small screens */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMobileMenuOpen}
        aria-label="Mở menu điều hướng"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Org context — OrgSwitcher for multi-org users, plain text for single-org */}
      {/* WHY: OrgSwitcher internally detects single vs multi-org and renders appropriately */}
      <div className="hidden lg:block">
        <OrgSwitcher
          currentPortal={
            pathname.startsWith("/hospital")
              ? "hospital"
              : pathname.startsWith("/provider")
                ? "provider"
                : pathname.startsWith("/admin")
                  ? "admin"
                  : undefined
          }
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Notification center — bell icon with unread badge + slide-in panel */}
      {/* vi: "Trung tâm thông báo" / en: "Notification center" */}
      <NotificationCenter />

      {/* User avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-9 rounded-full"
            aria-label="Menu người dùng"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={undefined} alt={user?.name ?? ""} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm leading-none font-medium">
                {user?.name ?? "Người dùng"}
              </p>
              <p className="text-muted-foreground text-xs leading-none">
                {user?.email ?? ""}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Hồ sơ cá nhân</span> {/* Profile */}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push(settingsPath)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Cài đặt</span> {/* Settings */}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Đăng xuất</span> {/* Sign out */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
