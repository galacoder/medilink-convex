"use client";

import { useState } from "react";

import { useMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const equipmentApi = api.equipment as any;

import { Button } from "@medilink/ui/button";

import { EquipmentCard } from "~/features/equipment/components/equipment-card";
import { EquipmentFiltersBar } from "~/features/equipment/components/equipment-filters";
import { EquipmentTable } from "~/features/equipment/components/equipment-table";
import { useEquipment } from "~/features/equipment/hooks/use-equipment";
import { equipmentLabels } from "~/features/equipment/labels";
import type { EquipmentFilters } from "~/features/equipment/types";

/**
 * Hospital equipment list page.
 *
 * WHY: This is the primary entry point for equipment management. Staff see
 * real-time equipment status via Convex subscriptions, can filter by status,
 * and navigate to create new equipment or view details.
 *
 * Responsive: DataTable on tablet/desktop, card grid on mobile (< md).
 */
export default function EquipmentListPage() {
  const [filters, setFilters] = useState<EquipmentFilters>({});

  const { equipment, isLoading, canLoadMore, isLoadingMore, loadMore } =
    useEquipment(filters);

  const updateStatusMutation = useMutation(
    equipmentApi.updateStatus as FunctionReference<"mutation">,
  );

  async function handleBulkUpdateStatus(ids: string[], newStatus: string) {
    await Promise.all(
      ids.map((id) =>
        updateStatusMutation({
          id: id as Id<"equipment">,
          newStatus: newStatus as Parameters<typeof updateStatusMutation>[0]["newStatus"],
        }),
      ),
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {equipmentLabels.title.vi}{" "}
            <span className="text-muted-foreground text-base font-normal">
              ({equipmentLabels.title.en})
            </span>
          </h1>
        </div>
        <Button asChild>
          <Link href="/hospital/equipment/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{equipmentLabels.addEquipment.vi}</span>
            <span className="sm:hidden">+</span>
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <EquipmentFiltersBar filters={filters} onChange={setFilters} />

      {/* Mobile card view (shown on small screens) */}
      <div className="md:hidden">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : equipment.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-16 text-center">
            <p className="text-muted-foreground text-lg font-medium">
              {equipmentLabels.noEquipment.vi}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {equipmentLabels.noEquipmentDesc.vi}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {equipment.map((item) => (
              <EquipmentCard key={item._id} equipment={item} />
            ))}
          </div>
        )}

        {/* Load more for mobile */}
        {canLoadMore && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore
                ? equipmentLabels.loading.vi
                : equipmentLabels.loadMore.vi}
            </Button>
          </div>
        )}
      </div>

      {/* Desktop/tablet table view */}
      <div className="hidden md:block">
        <EquipmentTable
          equipment={equipment}
          isLoading={isLoading}
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
          onBulkUpdateStatus={handleBulkUpdateStatus}
        />
      </div>
    </div>
  );
}
