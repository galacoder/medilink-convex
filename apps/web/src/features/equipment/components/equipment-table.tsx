"use client";

import { useState } from "react";

import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDownIcon, ChevronUpIcon, MoreHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import { Checkbox } from "@medilink/ui/checkbox";
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

import { equipmentLabels } from "../labels";
import type { Equipment } from "../types";
import { StatusBadge } from "./status-badge";

// Valid transitions map for bulk actions
const VALID_TRANSITIONS: Record<string, string[]> = {
  available: ["in_use", "maintenance", "damaged", "retired"],
  in_use: ["available", "maintenance", "damaged"],
  maintenance: ["available", "damaged"],
  damaged: ["available", "retired"],
  retired: [],
};

interface EquipmentTableProps {
  equipment: Equipment[];
  isLoading?: boolean;
  canLoadMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onBulkUpdateStatus?: (ids: string[], newStatus: string) => Promise<void>;
}

function getConditionLabel(condition: string): string {
  const map: Record<string, string> = {
    excellent: equipmentLabels.conditionValues.excellent.vi,
    good: equipmentLabels.conditionValues.good.vi,
    fair: equipmentLabels.conditionValues.fair.vi,
    poor: equipmentLabels.conditionValues.poor.vi,
  };
  return map[condition] ?? condition;
}

/**
 * Equipment data table using @tanstack/react-table.
 *
 * WHY: tanstack-table provides column sorting, row selection for bulk actions,
 * and a clean declarative column definition API. This pattern scales to future
 * columns without refactoring the table structure.
 */
export function EquipmentTable({
  equipment,
  isLoading = false,
  canLoadMore = false,
  isLoadingMore = false,
  onLoadMore,
  onBulkUpdateStatus,
}: EquipmentTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const columns: ColumnDef<Equipment>[] = [
    // Checkbox column for bulk selection
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={equipmentLabels.selectAll.vi}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Name column (Vietnamese primary)
    {
      accessorKey: "nameVi",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {equipmentLabels.name.vi}
          {column.getIsSorted() === "asc" ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDownIcon className="h-3 w-3" />
          ) : null}
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.nameVi}</span>
          <p className="text-muted-foreground text-xs">{row.original.nameEn}</p>
        </div>
      ),
    },
    // Status column
    {
      accessorKey: "status",
      header: equipmentLabels.status.vi,
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} locale="vi" />
      ),
    },
    // Condition column (hidden on mobile)
    {
      accessorKey: "condition",
      header: equipmentLabels.condition.vi,
      cell: ({ row }) => (
        <span className="hidden text-sm md:block">
          {getConditionLabel(row.original.condition)}
        </span>
      ),
    },
    // Location column (hidden on small screens)
    {
      accessorKey: "location",
      header: equipmentLabels.location.vi,
      cell: ({ row }) => (
        <span className="text-muted-foreground hidden text-sm lg:block">
          {row.original.location ?? "—"}
        </span>
      ),
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
                  router.push(`/hospital/equipment/${item._id}`);
                }}
              >
                {equipmentLabels.viewDetail.vi}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/hospital/equipment/${item._id}/edit`);
                }}
              >
                {equipmentLabels.edit.vi}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data: equipment,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row._id,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  // Get valid transitions common to ALL selected items
  const commonTransitions =
    selectedCount > 0
      ? selectedRows
          .map((row) => VALID_TRANSITIONS[row.original.status] ?? [])
          .reduce((acc, curr) => acc.filter((s) => curr.includes(s)))
      : [];

  async function handleBulkUpdateStatus(newStatus: string) {
    if (!onBulkUpdateStatus || selectedCount === 0) return;
    setIsBulkUpdating(true);
    try {
      const ids = selectedRows.map((row) => row.original._id);
      await onBulkUpdateStatus(ids, newStatus);
      setRowSelection({});
    } finally {
      setIsBulkUpdating(false);
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-md border">
        <div className="bg-muted/50 grid grid-cols-[40px_1fr_140px_120px_120px_40px] gap-4 px-4 py-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[40px_1fr_140px_120px_120px_40px] items-center gap-4 px-4 py-4"
            >
              {[...Array(6)].map((_, j) => (
                <Skeleton key={j} className="h-5 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (equipment.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-16 text-center">
        <p className="text-muted-foreground text-lg font-medium">
          {equipmentLabels.noEquipment.vi}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {equipmentLabels.noEquipmentDesc.vi}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk action toolbar */}
      {selectedCount > 0 && (
        <div className="bg-muted flex items-center gap-3 rounded-md px-4 py-2">
          <span className="text-sm font-medium">
            {selectedCount} {equipmentLabels.selectedItems.vi}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRowSelection({})}
          >
            {equipmentLabels.clearSelection.vi}
          </Button>
          {commonTransitions.length > 0 && onBulkUpdateStatus && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={isBulkUpdating}>
                  {equipmentLabels.bulkUpdateStatus.vi}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {commonTransitions.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleBulkUpdateStatus(status)}
                  >
                    {equipmentLabels.statusValues[status as keyof typeof equipmentLabels.statusValues]?.vi ?? status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Data table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
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
                data-state={row.getIsSelected() && "selected"}
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/hospital/equipment/${row.original._id}`)
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

      {/* Load more */}
      {canLoadMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore
              ? equipmentLabels.loading.vi
              : equipmentLabels.loadMore.vi}
          </Button>
        </div>
      )}
    </div>
  );
}
