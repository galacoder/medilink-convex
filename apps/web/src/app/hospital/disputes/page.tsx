"use client";

import type { Id } from "convex/_generated/dataModel";
import { useState } from "react";
import Link from "next/link";
import { AlertCircleIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@medilink/ui/dialog";

import type { DisputeStatus } from "~/features/disputes/types";
import { useActiveOrganization } from "~/auth/client";
import { DisputeForm } from "~/features/disputes/components/dispute-form";
import { DisputeTable } from "~/features/disputes/components/dispute-table";
import { useDisputes } from "~/features/disputes/hooks/use-disputes";
import { disputeLabels } from "~/features/disputes/labels";

const STATUS_TABS: { key: "all" | DisputeStatus; label: string }[] = [
  { key: "all", label: disputeLabels.filterTabs.all.vi },
  { key: "open", label: disputeLabels.filterTabs.open.vi },
  { key: "investigating", label: disputeLabels.filterTabs.investigating.vi },
  { key: "resolved", label: disputeLabels.filterTabs.resolved.vi },
  { key: "escalated", label: disputeLabels.filterTabs.escalated.vi },
  { key: "closed", label: disputeLabels.filterTabs.closed.vi },
];

/**
 * Hospital disputes list page.
 *
 * WHY: This is the primary entry point for dispute management. Staff see
 * all disputes in real-time via Convex subscriptions, can filter by status,
 * and navigate to create new disputes or view details.
 *
 * Responsive: DisputeTable on md+, simple card list on mobile (< md).
 *
 * data-testid="dispute-list" on the wrapper satisfies E2E test assertions.
 *
 * vi: "Trang danh sách khiếu nại" / en: "Disputes List Page"
 */
export default function DisputesListPage() {
  const { data: activeOrg, isPending: isOrgLoading } = useActiveOrganization();
  const [activeStatus, setActiveStatus] = useState<"all" | DisputeStatus>(
    "all",
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const organizationId = activeOrg?.id as Id<"organizations"> | undefined;

  const { disputes, isLoading } = useDisputes(
    organizationId,
    activeStatus !== "all" ? { status: activeStatus } : undefined,
  );

  function handleDisputeCreated() {
    setIsCreateOpen(false);
  }

  return (
    <div className="space-y-6" data-testid="dispute-list">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {disputeLabels.title.vi}{" "}
            <span className="text-muted-foreground text-base font-normal">
              ({disputeLabels.title.en})
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {disputeLabels.subtitle.vi}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <AlertCircleIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">
                {disputeLabels.actions.create.vi}
              </span>
              <span className="sm:hidden">+</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{disputeLabels.form.title.vi}</DialogTitle>
            </DialogHeader>
            {organizationId && (
              <DisputeForm
                organizationId={organizationId}
                onSuccess={handleDisputeCreated}
                onCancel={() => setIsCreateOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeStatus === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state while org loads */}
      {isOrgLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-14 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile card view (shown on small screens) */}
          <div className="md:hidden">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted h-20 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : disputes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-16 text-center">
                <p className="text-muted-foreground text-lg font-medium">
                  {disputeLabels.empty.noDisputes.vi}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {disputeLabels.empty.noDisputesDesc.vi}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((dispute) => (
                  <Link
                    key={dispute._id}
                    href={`/hospital/disputes/${dispute._id}`}
                    className="bg-card hover:bg-muted/50 block rounded-lg border p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                          {disputeLabels.types[dispute.type]?.vi ??
                            dispute.type}
                        </p>
                        {dispute.serviceRequestRef && (
                          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                            {dispute.serviceRequestRef.description}
                          </p>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(dispute.createdAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Desktop/tablet table view */}
          <div className="hidden md:block">
            <DisputeTable disputes={disputes} isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
