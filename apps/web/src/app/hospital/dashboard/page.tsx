"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import { useActiveOrganization, useSession } from "~/auth/client";

/**
 * Hospital portal dashboard — session-aware entry point for hospital staff.
 *
 * WHY: Displaying the logged-in user name, org name, and role confirms that
 * the complete auth flow works end-to-end: sign-up, org creation, session
 * persistence, and portal routing all function correctly.
 *
 * Future M2/M3 tasks will replace the placeholder cards with real
 * equipment tracking content.
 */
export default function HospitalDashboardPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();

  const isLoading = sessionPending || orgPending;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const userName = session?.user.name ?? "Người dùng"; // Người dùng = User
  const orgName = activeOrg?.name ?? "Tổ chức của bạn"; // Tổ chức của bạn = Your organization
  const userRole = activeOrg?.members?.[0]?.role ?? "member";

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Tổng quan {/* Dashboard */}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Chào mừng trở lại, {userName}!{/* Welcome back, [name]! */}
        </p>
      </div>

      {/* Session info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Thông tin tài khoản {/* Account Information */}
          </CardTitle>
          <CardDescription>
            Thông tin phiên đăng nhập hiện tại{/* Current session details */}
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
              Tổ chức {/* Organization */}
            </span>
            <span className="font-medium">{orgName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Vai trò {/* Role */}
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {userRole}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Equipment overview placeholder */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Thiết bị khả dụng {/* Available Equipment */}
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
              Đang mượn {/* Currently Borrowed */}
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
              Cần bảo dưỡng {/* Needs Maintenance */}
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
