"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import { useSession } from "~/auth/client";

/**
 * Platform admin dashboard — session-aware entry point for SangLeTech platform administrators.
 *
 * WHY: Platform admins are not part of any organization, so this dashboard only
 * shows user session data and platformRole. No useActiveOrganization() is needed.
 * This confirms that platform admin sign-in and portal routing work correctly.
 *
 * Future M4 tasks will replace stubs with real analytics, hospital management,
 * and audit log content.
 */
export default function PlatformAdminDashboardPage() {
  const { data: session, isPending: sessionPending } = useSession();

  if (sessionPending) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const userName = session?.user.name ?? "Quản trị viên"; // Administrator
  const userEmail = session?.user.email ?? "";
  const platformRole =
    (session?.user as { platformRole?: string | null } | undefined)
      ?.platformRole ?? "platform_admin";

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Quản lý nền tảng {/* Platform Management */}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Chào mừng trở lại, {userName}!{/* Welcome back, [name]! */}
        </p>
      </div>

      {/* Platform admin session info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Thông tin tài khoản quản trị {/* Admin Account Information */}
          </CardTitle>
          <CardDescription>
            Thông tin quản trị viên nền tảng {/* Platform administrator details */}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Tên {/* Name */}
            </span>
            <span className="font-medium">{userName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Email
            </span>
            <span className="font-medium">{userEmail}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Quyền hạn {/* Platform Role */}
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
              {platformRole}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Platform overview stats placeholder */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Bệnh viện đã đăng ký {/* Registered Hospitals */}
            </CardDescription>
            <CardTitle className="text-3xl">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Dữ liệu sẽ hiển thị sau {/* Data coming soon */}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Nhà cung cấp {/* Providers */}
            </CardDescription>
            <CardTitle className="text-3xl">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Dữ liệu sẽ hiển thị sau {/* Data coming soon */}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Tổng người dùng {/* Total Users */}
            </CardDescription>
            <CardTitle className="text-3xl">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Dữ liệu sẽ hiển thị sau {/* Data coming soon */}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
