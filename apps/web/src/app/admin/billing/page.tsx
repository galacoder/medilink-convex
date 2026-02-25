/**
 * Admin subscription list page — /admin/billing
 *
 * Shows all organizations with subscription status, filter by status,
 * search by name, and context-sensitive action buttons.
 *
 * vi: "Trang danh sach dang ky — Quan tri vien nen tang"
 * en: "Subscription list page — Platform Admin"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { StatusFilter } from "~/features/admin-billing";
import {
  billingLabels,
  StatusDashboard,
  SubscriptionFilters,
  SubscriptionListTable,
  useAdminBillingList,
} from "~/features/admin-billing";

/**
 * Main subscription management list page.
 *
 * vi: "Trang quan ly dang ky chinh"
 * en: "Main subscription management page"
 */
export default function AdminBillingPage() {
  const locale = "vi" as "vi" | "en"; // vi: default to Vietnamese
  const L = billingLabels;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { organizations, total, isLoading } = useAdminBillingList(
    statusFilter,
    searchQuery,
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">{L.title[locale]}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {L.subtitle[locale]}
        </p>
      </div>

      {/* Status dashboard cards */}
      {!isLoading && (
        <StatusDashboard organizations={organizations} locale={locale} />
      )}

      {/* Subscription list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>{L.title[locale]}</CardTitle>
              <CardDescription>
                {isLoading
                  ? L.loading[locale]
                  : `${total} ${L.organization[locale]}`}
              </CardDescription>
            </div>
            <SubscriptionFilters
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              onStatusChange={setStatusFilter}
              onSearchChange={setSearchQuery}
              locale={locale}
            />
          </div>
        </CardHeader>
        <CardContent>
          <SubscriptionListTable
            organizations={organizations}
            isLoading={isLoading}
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  );
}
