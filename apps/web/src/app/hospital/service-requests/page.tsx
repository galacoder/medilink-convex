"use client";

/**
 * Hospital service requests list page.
 *
 * WHY: Entry point for hospital staff to view all service requests, filter
 * by status, and navigate to create a new request. Uses reactive Convex
 * query via useServiceRequests so the list updates in real-time when a
 * provider submits a quote or status changes.
 *
 * Route: /hospital/service-requests
 */
import { useState } from "react";
import Link from "next/link";

import { Button } from "@medilink/ui/button";

import type { ServiceRequestStatus } from "~/features/service-requests/types";
import { ServiceRequestTable } from "~/features/service-requests/components/service-request-table";
import { StatusFilterTabs } from "~/features/service-requests/components/status-filter-tabs";
import { useServiceRequests } from "~/features/service-requests/hooks/use-service-requests";
import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";

const labels = serviceRequestLabels;

export default function ServiceRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { requests, isLoading } = useServiceRequests(
    statusFilter as ServiceRequestStatus | "all",
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{labels.pages.list.vi}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {/* Service Requests */}
            {labels.pages.list.en}
          </p>
        </div>
        <Button asChild>
          <Link href="/hospital/service-requests/new">
            {labels.buttons.create.vi}
          </Link>
        </Button>
      </div>

      {/* Status filter tabs */}
      <StatusFilterTabs value={statusFilter} onValueChange={setStatusFilter} />

      {/* Service requests table */}
      <ServiceRequestTable requests={requests} isLoading={isLoading} />
    </div>
  );
}
