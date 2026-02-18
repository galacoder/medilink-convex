"use client";

import { useRouter } from "next/navigation";
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

import { signOut, useSession } from "~/auth/client";
import type { NavItem } from "./nav-config";

interface HeaderProps {
  orgName?: string;
  navItems: NavItem[];
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
export function Header({ orgName, onMobileMenuOpen }: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();

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
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
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

      {/* Org name — shows the current organization context */}
      {orgName && (
        <span className="hidden text-sm font-medium text-muted-foreground lg:block">
          {orgName}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

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
              <p className="text-sm font-medium leading-none">
                {user?.name ?? "Người dùng"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email ?? ""}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Hồ sơ cá nhân</span> {/* Profile */}
          </DropdownMenuItem>

          <DropdownMenuItem>
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
