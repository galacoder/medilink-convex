"use client";

/**
 * Platform admin cross-tenant service request list page.
 *
 * Shows ALL service requests across all hospitals and providers.
 * Includes bottleneck highlighting (>7 days in current status).
 * Supports filtering by status, hospital, provider, and date range.
 *
 * vi: "Trang danh sách yêu cầu dịch vụ toàn nền tảng"
 * en: "Platform-wide service request list page"
 */
import { useState } from "react";
import { AlertTriangleIcon, ClipboardListIcon, FilterIcon } from "lucide-react";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Label } from "@medilink/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@medilink/ui/sheet";

import type {
  AdminServiceRequest,
  AdminServiceRequestFilters,
} from "~/features/admin-disputes";
import {
  adminDisputeLabels,
  AdminServiceRequestTable,
  useAdminServiceRequests,
} from "~/features/admin-disputes";

const SERVICE_REQUEST_STATUSES: {
  value: NonNullable<AdminServiceRequestFilters["status"]>;
  label: string;
}[] = [
  {
    value: "pending",
    label: adminDisputeLabels.serviceRequestStatuses.pending.vi,
  },
  {
    value: "quoted",
    label: adminDisputeLabels.serviceRequestStatuses.quoted.vi,
  },
  {
    value: "accepted",
    label: adminDisputeLabels.serviceRequestStatuses.accepted.vi,
  },
  {
    value: "in_progress",
    label: adminDisputeLabels.serviceRequestStatuses.in_progress.vi,
  },
  {
    value: "completed",
    label: adminDisputeLabels.serviceRequestStatuses.completed.vi,
  },
  {
    value: "cancelled",
    label: adminDisputeLabels.serviceRequestStatuses.cancelled.vi,
  },
  {
    value: "disputed",
    label: adminDisputeLabels.serviceRequestStatuses.disputed.vi,
  },
];

/**
 * Platform admin service request list.
 *
 * WHY: This is a dedicated admin view with no org scoping, unlike the hospital
 * portal's /hospital/service-requests which filters by organizationId.
 * Platform admins need to see ALL requests to detect cross-org bottlenecks
 * and identify systemic issues.
 */
export default function AdminServiceRequestsPage() {
  const [filters, setFilters] = useState<AdminServiceRequestFilters>({});
  const [showBottlenecksOnly, setShowBottlenecksOnly] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Query all service requests — cross-tenant, paginated (default 50 per page)
  const {
    results: typedRequests,
    status: paginationStatus,
    loadMore,
  } = useAdminServiceRequests({
    status: filters.status,
    hospitalId: filters.hospitalId,
  });

  const isLoading = paginationStatus === "LoadingFirstPage";

  // Client-side bottleneck filter (applied on top of server results)
  const displayRequests = showBottlenecksOnly
    ? typedRequests.filter((r) => r.isBottleneck)
    : typedRequests;

  const bottleneckCount = typedRequests.filter((r) => r.isBottleneck).length;
  const disputedCount = typedRequests.filter(
    (r) => r.status === "disputed",
  ).length;

  function handleResetFilters() {
    setFilters({});
    setShowBottlenecksOnly(false);
    setIsFilterSheetOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ClipboardListIcon className="h-6 w-6" />
            {adminDisputeLabels.titles.serviceRequests.vi}
            {/* Platform-Wide Service Requests */}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tất cả yêu cầu dịch vụ từ mọi bệnh viện và nhà cung cấp
            {/* All service requests from all hospitals and providers */}
          </p>
        </div>

        {/* Filter sheet trigger */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FilterIcon className="h-4 w-4" />
              {adminDisputeLabels.filters.title.vi} {/* Filters */}
              {(filters.status ?? filters.hospitalId) && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  Đang lọc
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {adminDisputeLabels.filters.title.vi} {/* Filters */}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {/* Status filter */}
              <div className="space-y-2">
                <Label>{adminDisputeLabels.filters.status.vi}</Label>
                <Select
                  value={filters.status ?? "all"}
                  onValueChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      status:
                        val === "all"
                          ? undefined
                          : (val as AdminServiceRequestFilters["status"]),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {adminDisputeLabels.filters.allStatuses.vi}
                    </SelectItem>
                    {SERVICE_REQUEST_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bottleneck filter */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bottlenecksOnly"
                  checked={showBottlenecksOnly}
                  onChange={(e) => setShowBottlenecksOnly(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="bottlenecksOnly">
                  {adminDisputeLabels.filters.showBottlenecksOnly.vi}
                  {/* Show Bottlenecks Only */}
                </Label>
              </div>

              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full"
              >
                {adminDisputeLabels.filters.reset.vi} {/* Reset Filters */}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Tổng yêu cầu dịch vụ {/* Total service requests */}
            </CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? "—" : typedRequests.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Trên toàn nền tảng {/* Across all organizations */}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-500" />
              Tắc nghẽn {/* Bottlenecks */}
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {isLoading ? "—" : bottleneckCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Kẹt hơn 7 ngày {/* Stuck for more than 7 days */}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-red-600">
              Đang tranh chấp {/* Currently disputed */}
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {isLoading ? "—" : disputedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Cần theo dõi {/* Requires attention */}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service request table */}
      <AdminServiceRequestTable
        serviceRequests={displayRequests}
        isLoading={isLoading}
      />

      {/* Load more button for pagination */}
      {paginationStatus === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(50)}>
            Tải thêm {/* Load More */}
          </Button>
        </div>
      )}
      {paginationStatus === "LoadingMore" && (
        <div className="flex justify-center">
          <Button variant="outline" disabled>
            Đang tải... {/* Loading... */}
          </Button>
        </div>
      )}
    </div>
  );
}
