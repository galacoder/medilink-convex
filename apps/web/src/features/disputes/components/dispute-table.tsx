"use client";

import { useState } from "react";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { ChevronDownIcon, ChevronUpIcon, MoreHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@medilink/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@medilink/ui/dropdown-menu";
import { Skeleton } from "@medilink/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";

import { disputeLabels } from "../labels";
import type { DisputeWithRef } from "../types";
import { DisputeStatusBadge } from "./dispute-status-badge";

interface DisputeTableProps {
  disputes: DisputeWithRef[];
  isLoading?: boolean;
  canLoadMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

/**
 * Dispute data table using @tanstack/react-table.
 *
 * WHY: tanstack-table provides column sorting and a clean declarative column
 * definition API. This pattern scales to future columns without refactoring
 * the table structure. Follows the equipment-table.tsx pattern.
 *
 * vi: "Bảng danh sách tranh chấp" / en: "Disputes table"
 */
export function DisputeTable({
  disputes,
  isLoading = false,
  canLoadMore = false,
  isLoadingMore = false,
  onLoadMore,
}: DisputeTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<DisputeWithRef>[] = [
    // Type column
    {
      accessorKey: "type",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {disputeLabels.fields.type.vi}
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="h-3 w-3" />
          ) : null}
        </button>
      ),
      cell: ({ row }) => {
        const type = row.original.type;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const label = disputeLabels.types[type]?.vi ?? type;
        return <span className="font-medium">{label}</span>;
      },
    },
    // Status column
    {
      accessorKey: "status",
      header: disputeLabels.fields.status.vi,
      cell: ({ row }) => (
        <DisputeStatusBadge status={row.original.status} locale="vi" />
      ),
    },
    // Service request column
    {
      id: "serviceRequest",
      header: disputeLabels.fields.serviceRequest.vi,
      cell: ({ row }) => {
        const ref = row.original.serviceRequestRef;
        if (!ref) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <span className="text-muted-foreground max-w-[200px] truncate text-sm">
            {ref.description}
          </span>
        );
      },
    },
    // Created date column
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {disputeLabels.fields.createdAt.vi}
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="h-3 w-3" />
          ) : null}
        </button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <span className="text-muted-foreground text-sm">
            {date.toLocaleDateString("vi-VN")}
          </span>
        );
      },
    },
    // Actions column
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/hospital/disputes/${item._id}`);
                }}
              >
                {disputeLabels.actions.viewDetail.vi}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data: disputes,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row._id,
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-md border">
        <div className="bg-muted/50 grid grid-cols-[1fr_140px_200px_120px_40px] gap-4 px-4 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_140px_200px_120px_40px] items-center gap-4 px-4 py-4"
            >
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-5 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (disputes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-16 text-center">
        <p className="text-muted-foreground text-lg font-medium">
          {disputeLabels.empty.noDisputes.vi}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {disputeLabels.empty.noDisputesDesc.vi}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                className="cursor-pointer"
                onClick={() => router.push(`/hospital/disputes/${row.original._id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Load more */}
      {canLoadMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore
              ? disputeLabels.loading.vi
              : disputeLabels.actions.loadMore.vi}
          </Button>
        </div>
      )}
    </div>
  );
}
