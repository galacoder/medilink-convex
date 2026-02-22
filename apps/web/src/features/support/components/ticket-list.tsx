"use client";

import { useState } from "react";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import { Skeleton } from "@medilink/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";

import type { SupportTicket, SupportTicketStatus } from "../types";
import { supportLabels } from "../labels";
import { SupportStatusBadge } from "./support-status-badge";

interface TicketListProps {
  tickets: SupportTicket[];
  isLoading?: boolean;
  onTicketClick?: (ticketId: string) => void;
}

const STATUS_TABS: (SupportTicketStatus | "all")[] = [
  "all",
  "open",
  "in_progress",
  "resolved",
  "closed",
];

/**
 * Support ticket list with status filter tabs.
 *
 * WHY: Provides a filterable table of support tickets following the
 * disputes/dispute-table.tsx pattern. Status tabs allow quick filtering
 * without complex filter UI. Clicking a row navigates to ticket detail.
 *
 * vi: "Danh sach phieu ho tro" / en: "Support ticket list"
 */
export function TicketList({
  tickets,
  isLoading = false,
  onTicketClick,
}: TicketListProps) {
  const [activeTab, setActiveTab] = useState<SupportTicketStatus | "all">(
    "all",
  );

  // Filter tickets by status tab
  const filteredTickets =
    activeTab === "all"
      ? tickets
      : tickets.filter((t) => t.status === activeTab);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <Skeleton key={tab} className="h-8 w-20 rounded-md" />
          ))}
        </div>
        <div className="overflow-hidden rounded-md border">
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = tab === activeTab;
          const count =
            tab === "all"
              ? tickets.length
              : tickets.filter((t) => t.status === tab).length;
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
              className="gap-1.5"
            >
              {label}
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-[20px] px-1.5 text-xs"
              >
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-16 text-center">
          <p className="text-muted-foreground text-lg font-medium">
            {supportLabels.empty.noTickets.vi}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {supportLabels.empty.noTicketsDesc.vi}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{supportLabels.fields.subject.vi}</TableHead>
                <TableHead>{supportLabels.fields.category.vi}</TableHead>
                <TableHead>{supportLabels.fields.priority.vi}</TableHead>
                <TableHead>{supportLabels.fields.status.vi}</TableHead>
                <TableHead>{supportLabels.fields.createdAt.vi}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow
                  key={ticket._id}
                  className="cursor-pointer"
                  onClick={() => onTicketClick?.(ticket._id)}
                >
                  <TableCell className="font-medium">
                    {ticket.subjectVi}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {supportLabels.categories[ticket.category].vi}
                    </span>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell>
                    <SupportStatusBadge status={ticket.status} locale="vi" />
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
                    </span>
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

/**
 * Inline priority badge component.
 * WHY: Priority is a secondary attribute shown in the ticket list table.
 */
function PriorityBadge({ priority }: { priority: SupportTicket["priority"] }) {
  const colorMap: Record<SupportTicket["priority"], string> = {
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    critical: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <Badge className={`border ${colorMap[priority]}`}>
      {supportLabels.priorities[priority].vi}
    </Badge>
  );
}
