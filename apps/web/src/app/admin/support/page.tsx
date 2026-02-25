"use client";

import type { FunctionReference } from "convex/server";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { LifeBuoyIcon } from "lucide-react";

import { api } from "@medilink/backend";
import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";
import { Skeleton } from "@medilink/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";

import type { SupportTicketStatus } from "~/features/support/types";
import { SupportStatusBadge } from "~/features/support/components/support-status-badge";
import { supportLabels } from "~/features/support/labels";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const supportApi = (api as any).support;
type QueryRef = FunctionReference<"query">;
type MutationRef = FunctionReference<"mutation">;
const listAllFn: QueryRef = supportApi.listAll;
const closeFn: MutationRef = supportApi.close;
const adminUpdateStatusFn: MutationRef = supportApi.adminUpdateStatus;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

const STATUS_TABS: (SupportTicketStatus | "all")[] = [
  "all",
  "open",
  "in_progress",
  "resolved",
  "closed",
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

/**
 * Admin support ticket management page.
 *
 * WHY: Platform admins need a cross-org view of all support tickets
 * to triage, assign, update status, and close tickets.
 *
 * vi: "Trang quan ly phieu ho tro (admin)" / en: "Admin support management page"
 */
export default function AdminSupportPage() {
  const [activeTab, setActiveTab] = useState<SupportTicketStatus | "all">(
    "all",
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tickets = useQuery(
    listAllFn,
    activeTab !== "all" ? { status: activeTab } : {},
  );
  const closeMutation = useMutation(closeFn);
  const updateStatusMutation = useMutation(adminUpdateStatusFn);

  const isLoading = tickets === undefined;
  const ticketList = (tickets ?? []) as Array<{
    _id: string;
    subjectVi: string;
    category: string;
    priority: string;
    status: SupportTicketStatus;
    organizationName?: string | null;
    creatorName?: string | null;
    assigneeName?: string | null;
    createdAt: number;
  }>;

  async function handleClose(ticketId: string) {
    try {
      await closeMutation({ ticketId });
    } catch {
      // Error handling via toast in production
    }
  }

  async function handleStatusChange(ticketId: string, status: string) {
    try {
      await updateStatusMutation({
        ticketId,
        status: status as SupportTicketStatus,
      });
    } catch {
      // Error handling via toast in production
    }
  }

  return (
    <div className="space-y-6" data-testid="admin-support">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">
          <LifeBuoyIcon className="mr-2 inline-block h-6 w-6" />
          {supportLabels.admin.title.vi}{" "}
          <span className="text-muted-foreground text-base font-normal">
            ({supportLabels.admin.title.en})
          </span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {supportLabels.admin.subtitle.vi}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = tab === activeTab;
          const label =
            tab === "all"
              ? supportLabels.filterTabs.all.vi
              : supportLabels.filterTabs[tab].vi;

          return (
            <Button
              key={tab}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </Button>
          );
        })}
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : ticketList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-16 text-center">
          <p className="text-muted-foreground text-lg font-medium">
            {supportLabels.empty.noTickets.vi}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{supportLabels.fields.subject.vi}</TableHead>
                <TableHead>{supportLabels.admin.organization.vi}</TableHead>
                <TableHead>{supportLabels.fields.category.vi}</TableHead>
                <TableHead>{supportLabels.fields.priority.vi}</TableHead>
                <TableHead>{supportLabels.fields.status.vi}</TableHead>
                <TableHead>{supportLabels.admin.assignee.vi}</TableHead>
                <TableHead>{supportLabels.fields.createdAt.vi}</TableHead>
                <TableHead className="w-[180px]">
                  {/* Actions column */}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketList.map((ticket) => (
                <TableRow key={ticket._id}>
                  <TableCell>
                    <Link
                      href={`/admin/support/${ticket._id}`}
                      className="font-medium hover:underline"
                    >
                      {ticket.subjectVi}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {ticket.organizationName ?? "---"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {supportLabels.categories[
                        ticket.category as keyof typeof supportLabels.categories
                      ]?.vi ?? ticket.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`border ${PRIORITY_COLORS[ticket.priority] ?? ""}`}
                    >
                      {supportLabels.priorities[
                        ticket.priority as keyof typeof supportLabels.priorities
                      ]?.vi ?? ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <SupportStatusBadge status={ticket.status} locale="vi" />
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {ticket.assigneeName ?? supportLabels.admin.unassigned.vi}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {ticket.status !== "closed" && (
                        <>
                          <Select
                            onValueChange={(val) =>
                              void handleStatusChange(ticket._id, val)
                            }
                          >
                            <SelectTrigger className="h-8 w-[120px]">
                              <SelectValue
                                placeholder={supportLabels.fields.status.vi}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                [
                                  "open",
                                  "in_progress",
                                  "resolved",
                                ] as SupportTicketStatus[]
                              )
                                .filter((s) => s !== ticket.status)
                                .map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {supportLabels.statuses[s].vi}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            onClick={() => void handleClose(ticket._id)}
                          >
                            {supportLabels.actions.close.vi}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
