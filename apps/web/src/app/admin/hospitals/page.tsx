"use client";

/**
 * Platform admin hospital list page.
 *
 * WHY: Platform admins need a central view of all hospital organizations
 * with the ability to search/filter, onboard new hospitals, and take
 * corrective action (suspend/reactivate) without database access.
 *
 * This is a client component because it uses Convex real-time subscriptions
 * (useQuery via useAdminHospitals hook) and manages filter state.
 *
 * vi: "Trang danh sách bệnh viện — Quản trị viên nền tảng"
 * en: "Hospital list page — Platform Admin"
 */
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { HospitalFilters } from "~/features/admin-hospitals";
import {
  HospitalFiltersBar,
  HospitalTable,
  OnboardHospitalDialog,
  useAdminHospitals,
} from "~/features/admin-hospitals";
import { adminHospitalLabels } from "~/features/admin-hospitals/labels";

/**
 * Hospital management page for platform admin.
 * Shows all hospital orgs with search/filter/pagination controls.
 *
 * vi: "Trang quản lý bệnh viện" / en: "Hospital management page"
 */
export default function AdminHospitalsPage() {
  const locale = "vi"; // vi: default to Vietnamese / en: default to Vietnamese
  const L = adminHospitalLabels;

  const [filters, setFilters] = useState<HospitalFilters>({});
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 20;

  const { hospitals, total, hasMore, isLoading } = useAdminHospitals(
    filters,
    PAGE_SIZE,
    offset,
  );

  const handleFiltersChange = (newFilters: HospitalFilters) => {
    setFilters(newFilters);
    setOffset(0); // Reset pagination when filters change
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {L.title[locale]} {/* Quản lý bệnh viện / Hospital Management */}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {L.subtitle[locale]}
          </p>
        </div>
        <OnboardHospitalDialog locale={locale} />
      </div>

      {/* Stats summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {L.title[locale]} {/* Quản lý bệnh viện */}
            </CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? "--" : total}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {L.subtitle[locale]}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hospital list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{L.title[locale]}</CardTitle>
              <CardDescription>
                {isLoading ? L.loading[locale] : `${total} ${L.title[locale]}`}
              </CardDescription>
            </div>
            <HospitalFiltersBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              locale={locale}
            />
          </div>
        </CardHeader>
        <CardContent>
          <HospitalTable
            hospitals={hospitals}
            isLoading={isLoading}
            locale={locale}
          />

          {/* Pagination controls */}
          {!isLoading && total > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} / {total}
              </p>
              <div className="flex gap-2">
                <button
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0}
                >
                  {/* Trước / Prev */}←
                </button>
                <button
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={!hasMore}
                >
                  {/* Sau / Next */}→
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
