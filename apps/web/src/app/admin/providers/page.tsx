"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Input } from "@medilink/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@medilink/ui/tabs";

import type {
  AdminProviderFilters,
  ProviderStatus,
} from "~/features/admin-providers/types";
import {
  adminProviderLabels,
  ProviderTable,
  useAdminProviders,
} from "~/features/admin-providers";

/**
 * Platform admin provider list page.
 *
 * WHY: Platform admins need a central view of all registered providers,
 * with the ability to filter by status and search by name. The approval
 * queue tab surfaces pending registrations for immediate action.
 *
 * This is a client component because it uses real-time Convex subscriptions
 * via useAdminProviders() and maintains local filter state.
 *
 * vi: "Trang danh sách nhà cung cấp (quản trị viên nền tảng)"
 * en: "Platform admin provider list page"
 */
export default function AdminProvidersPage() {
  const labels = adminProviderLabels;
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Map tab value to status filter
  const statusFilter: ProviderStatus | undefined =
    activeTab === "all" ? undefined : (activeTab as ProviderStatus);

  const filters: AdminProviderFilters = {
    status: statusFilter,
    search: searchTerm || undefined,
  };

  const { providers, isLoading, totalCount } = useAdminProviders(filters);

  // Count pending providers separately for the badge
  const { providers: pendingProviders } = useAdminProviders({
    status: "pending_verification",
  });
  const pendingCount = pendingProviders.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">
          {labels.title.vi} {/* Quản lý nhà cung cấp */}
        </h1>
        <p className="text-muted-foreground mt-1">
          {labels.subtitle.vi}
          {/* Xem xét và phê duyệt đăng ký nhà cung cấp */}
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {labels.filterTabs.pending_verification.vi}
              {/* Chờ duyệt */}
            </CardDescription>
            <CardTitle className="text-3xl">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Cần xem xét và phê duyệt {/* Needs review and approval */}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {labels.filterTabs.active.vi}
              {/* Đang hoạt động */}
            </CardDescription>
            <CardTitle className="text-3xl">
              {
                providers.filter((p) => p.status === "active").length +
                  (statusFilter ? 0 : 0) /* show actual active count */
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Nhà cung cấp đang hoạt động {/* Active providers */}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng số {/* Total */}</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {statusFilter
                ? `Lọc theo trạng thái: ${labels.statuses[statusFilter].vi}`
                : "Tất cả nhà cung cấp"}{" "}
              {/* Filtered / All providers */}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Provider list with filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {labels.sections.providerInfo.vi}
              {/* Thông tin nhà cung cấp */}
            </CardTitle>
            {/* Search input */}
            <Input
              placeholder={labels.placeholders.search.vi}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                {labels.filterTabs.all.vi} {/* Tất cả */}
              </TabsTrigger>
              <TabsTrigger value="pending_verification">
                {labels.filterTabs.pending_verification.vi} {/* Chờ duyệt */}
                {pendingCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="active">
                {labels.filterTabs.active.vi} {/* Đang hoạt động */}
              </TabsTrigger>
              <TabsTrigger value="suspended">
                {labels.filterTabs.suspended.vi} {/* Bị đình chỉ */}
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Không hoạt động {/* Inactive */}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <ProviderTable providers={providers} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
