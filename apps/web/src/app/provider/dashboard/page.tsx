"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import { useActiveOrganization, useSession } from "~/auth/client";
import { useProviderOfferings } from "~/features/providers/hooks/use-provider-offerings";

/**
 * Provider portal dashboard — session-aware entry point for medical equipment providers.
 *
 * WHY: Displaying session context (user name, org, role) confirms that the provider
 * auth flow works correctly end-to-end. The offering count card uses real data from
 * Convex via useProviderOfferings, replacing the previous placeholder "--" value.
 */
export default function ProviderDashboardPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();

  const organizationId = activeOrg?.id ?? "";
  const { offerings, isLoading: offeringsLoading } =
    useProviderOfferings(organizationId);

  const isLoading = sessionPending || orgPending;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="bg-muted h-4 w-48 animate-pulse rounded" />
      </div>
    );
  }

  const userName = session?.user.name ?? "Người dùng"; // Người dùng = User
  const orgName = activeOrg?.name ?? "Tổ chức của bạn"; // Your organization
  const members = activeOrg?.members;
  const userRole = members?.[0]?.role ?? "member";

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-semibold">Tổng quan {/* Dashboard */}</h1>
        <p className="text-muted-foreground mt-1">
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
            Thông tin nhà cung cấp {/* Provider details */}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tên {/* Name */}</span>
            <span className="font-medium">{userName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Nhà cung cấp {/* Provider */}
            </span>
            <span className="font-medium">{orgName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Vai trò {/* Role */}</span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              {userRole}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Offerings overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Sản phẩm đang cung cấp {/* Active Offerings */}
            </CardDescription>
            <CardTitle className="text-3xl">
              {offeringsLoading ? (
                <span className="text-muted-foreground">--</span>
              ) : (
                offerings.length
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {
                offeringsLoading
                  ? "Đang tải..." /* Loading... */
                  : "Dịch vụ đang cung cấp" /* Active services */
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Yêu cầu báo giá {/* Quote Requests */}
            </CardDescription>
            <CardTitle className="text-3xl">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Dữ liệu sẽ hiển thị sau {/* Data coming soon */}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Hợp đồng đang hoạt động {/* Active Contracts */}
            </CardDescription>
            <CardTitle className="text-3xl">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Dữ liệu sẽ hiển thị sau {/* Data coming soon */}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
