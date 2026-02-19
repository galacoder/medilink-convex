"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDownIcon, ChevronUpIcon, EyeIcon } from "lucide-react";

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

import type { AuditLogEntryWithDetails } from "../types";
import { auditLogLabels } from "../labels";
import { AuditLogDetailModal } from "./audit-log-detail-modal";

interface AuditLogTableProps {
  entries: AuditLogEntryWithDetails[];
  isLoading?: boolean;
  canLoadMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

/**
 * Audit log data table using @tanstack/react-table.
 *
 * Displays: timestamp, actor, action, resource type, resource ID, organization.
 * Clicking a row or the detail button opens the AuditLogDetailModal for the
 * full JSON payload (before/after values).
 *
 * WHY: tanstack-table provides column sorting without client-side state bloat.
 * Follows the dispute-table.tsx pattern for consistency.
 *
 * vi: "Bảng nhật ký kiểm tra" / en: "Audit log table"
 */
export function AuditLogTable({
  entries,
  isLoading = false,
  canLoadMore = false,
  isLoadingMore = false,
  onLoadMore,
}: AuditLogTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedEntry, setSelectedEntry] =
    useState<AuditLogEntryWithDetails | null>(null);

  const columns: ColumnDef<AuditLogEntryWithDetails>[] = [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {auditLogLabels.fields.timestamp.vi}
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="h-3 w-3" />
          ) : null}
        </button>
      ),
      cell: ({ row }) => {
        const ts = row.original.createdAt;
        return (
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {new Date(ts).toLocaleString("vi-VN")}
          </span>
        );
      },
    },
    {
      accessorKey: "actorName",
      header: auditLogLabels.fields.actor.vi,
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium">
            {row.original.actorName ?? row.original.actorId}
          </div>
          {row.original.actorEmail && (
            <div className="text-muted-foreground text-xs">
              {row.original.actorEmail}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {auditLogLabels.fields.action.vi}
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="h-3 w-3" />
          ) : null}
        </button>
      ),
      cell: ({ row }) => (
        <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
          {row.original.action}
        </code>
      ),
    },
    {
      accessorKey: "resourceType",
      header: auditLogLabels.fields.resourceType.vi,
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
          {row.original.resourceType}
        </span>
      ),
    },
    {
      accessorKey: "resourceId",
      header: auditLogLabels.fields.resourceId.vi,
      cell: ({ row }) => (
        <code className="text-muted-foreground font-mono text-xs">
          {row.original.resourceId.slice(0, 12)}...
        </code>
      ),
    },
    {
      accessorKey: "organizationName",
      header: auditLogLabels.fields.organization.vi,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.organizationName ?? row.original.organizationId}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEntry(row.original);
          }}
        >
          <EyeIcon className="h-3.5 w-3.5" />
          <span className="sr-only">
            {auditLogLabels.actions.viewDetail.vi}
          </span>
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">
          {auditLogLabels.empty.noEntries.vi}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {auditLogLabels.empty.noEntriesDesc.vi}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedEntry(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Load more button */}
      {canLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore
              ? auditLogLabels.loading.vi
              : auditLogLabels.actions.loadMore.vi}
          </Button>
        </div>
      )}

      {/* Detail modal */}
      {selectedEntry && (
        <AuditLogDetailModal
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => {
            if (!open) setSelectedEntry(null);
          }}
        />
      )}
    </>
  );
}
