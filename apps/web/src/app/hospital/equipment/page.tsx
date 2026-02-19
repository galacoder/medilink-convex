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
            {equipmentLabels.addEquipment.vi}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <EquipmentFiltersBar filters={filters} onChange={setFilters} />

      {/* Equipment table */}
      <EquipmentTable
        equipment={equipment}
        isLoading={isLoading}
        canLoadMore={canLoadMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onBulkUpdateStatus={handleBulkUpdateStatus}
      />
    </div>
  );
}
