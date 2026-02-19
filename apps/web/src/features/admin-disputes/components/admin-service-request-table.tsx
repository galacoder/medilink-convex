"use client";

/**
 * Cross-tenant service request table for platform admin view.
 * Shows all service requests across all organizations with bottleneck highlighting.
 *
 * vi: "Bảng yêu cầu dịch vụ toàn nền tảng" / en: "Platform-wide service request table"
 */
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";

import { Badge } from "@medilink/ui/badge";
import { Skeleton } from "@medilink/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@medilink/ui/tooltip";

import type { AdminServiceRequest } from "../types";
import { adminDisputeLabels } from "../labels";

interface AdminServiceRequestTableProps {
  serviceRequests: AdminServiceRequest[];
  isLoading?: boolean;
}

/**
 * Status badge colors for service request statuses.
 * Maps each status to a Tailwind color class.
 */
const STATUS_COLORS: Record<AdminServiceRequest["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  quoted: "bg-blue-100 text-blue-800",
  accepted: "bg-indigo-100 text-indigo-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  disputed: "bg-red-100 text-red-800",
};

/**
 * Cross-tenant service request table with bottleneck detection.
 * Platform admins can click a row to navigate to the service request in the
 * relevant hospital's portal for detailed view.
 *
 * WHY: Using @tanstack/react-table for column sorting follows the project
 * convention established in dispute-table.tsx and service-request-table.tsx.
 */
export function AdminServiceRequestTable({
  serviceRequests,
  isLoading = false,
}: AdminServiceRequestTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<AdminServiceRequest>[] = [
    // Hospital column
    {
      accessorKey: "hospitalName",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {adminDisputeLabels.columns.hospital.vi}
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="h-3 w-3" />
          ) : null}
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.hospitalName ?? "—"}</span>
      ),
    },
    // Provider column
    {
      accessorKey: "providerName",
      header: adminDisputeLabels.columns.provider.vi,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.providerName ?? "—"}
        </span>
      ),
    },
    // Status column
    {
      accessorKey: "status",
      header: adminDisputeLabels.columns.status.vi,
      cell: ({ row }) => {
        const status = row.original.status;
        const label =
          adminDisputeLabels.serviceRequestStatuses[status].vi;
        const colorClass = STATUS_COLORS[status];
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
          >
            {label}
          </span>
        );
      },
    },
    // Type column
    {
      accessorKey: "type",
      header: adminDisputeLabels.columns.type.vi,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm capitalize">
          {row.original.type}
        </span>
      ),
    },
    // Bottleneck column
    {
      id: "bottleneck",
      header: adminDisputeLabels.columns.bottleneck.vi,
      cell: ({ row }) => {
        if (!row.original.isBottleneck) return null;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-xs text-amber-700"
                  >
                    {adminDisputeLabels.bottleneck.badge.vi}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  {adminDisputeLabels.bottleneck.tooltip.vi}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
    // Created date column
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {adminDisputeLabels.columns.createdAt.vi}
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
  ];

  const table = useReactTable({
    data: serviceRequests,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row._id,
  });

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-md border">
        <div className="bg-muted/50 grid grid-cols-6 gap-4 px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-6 items-center gap-4 px-4 py-4"
            >
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-5 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (serviceRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-16 text-center">
        <p className="text-muted-foreground text-lg font-medium">
          {adminDisputeLabels.empty.noServiceRequests.vi}
        </p>
      </div>
    );
  }

  return (
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
              className={`cursor-pointer ${
                row.original.isBottleneck
                  ? "bg-amber-50/50 hover:bg-amber-50"
                  : ""
              }`}
              onClick={() =>
                router.push(`/admin/service-requests/${row.original._id}`)
              }
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
  );
}
