"use client";

/**
 * Escalated disputes queue table for platform admin arbitration.
 * Shows all disputes that have been escalated for platform admin review.
 *
 * vi: "Bảng tranh chấp leo thang" / en: "Escalated disputes queue table"
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
import { ChevronDownIcon, ChevronUpIcon, GavelIcon } from "lucide-react";

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

import type { EscalatedDispute } from "../types";
import { adminDisputeLabels } from "../labels";

interface EscalatedDisputeTableProps {
  disputes: EscalatedDispute[];
  isLoading?: boolean;
}

/**
 * Dispute type badge colors.
 */
const TYPE_COLORS = {
  quality: "bg-purple-100 text-purple-800",
  pricing: "bg-orange-100 text-orange-800",
  timeline: "bg-blue-100 text-blue-800",
  other: "bg-gray-100 text-gray-800",
} as const;

/**
 * Table of escalated disputes awaiting platform admin arbitration.
 * Clicking "Trọng tài" navigates to the dispute detail page.
 *
 * WHY: Separate from AdminServiceRequestTable because escalated disputes
 * have a different data shape (EscalatedDispute with hospital/provider names)
 * and different primary action (arbitrate vs. view detail).
 */
export function EscalatedDisputeTable({
  disputes,
  isLoading = false,
}: EscalatedDisputeTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<EscalatedDispute>[] = [
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
    // Dispute type column
    {
      accessorKey: "type",
      header: adminDisputeLabels.columns.type.vi,
      cell: ({ row }) => {
        const type = row.original.type;
        const colorClass = TYPE_COLORS[type];
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
          >
            {type}
          </span>
        );
      },
    },
    // Description column
    {
      id: "description",
      header: adminDisputeLabels.columns.description.vi,
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-[240px] truncate text-sm">
          {row.original.descriptionVi}
        </span>
      ),
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
    // Actions column
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/disputes/${row.original._id}`);
          }}
        >
          <GavelIcon className="h-3.5 w-3.5" />
          {adminDisputeLabels.actions.arbitrate.vi}
        </Button>
      ),
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

  if (disputes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-16 text-center">
        <GavelIcon className="text-muted-foreground mb-3 h-8 w-8" />
        <p className="text-muted-foreground text-lg font-medium">
          {adminDisputeLabels.empty.noEscalatedDisputes.vi}
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
              className="cursor-pointer"
              onClick={() => router.push(`/admin/disputes/${row.original._id}`)}
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
