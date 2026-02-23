"use client";

import type { Id } from "@medilink/db/dataModel";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@medilink/ui/button";
import { Skeleton } from "@medilink/ui/skeleton";

import { EquipmentDetail } from "~/features/equipment/components/equipment-detail";
import { EquipmentQR } from "~/features/equipment/components/equipment-qr";
import { HistoryTimeline } from "~/features/equipment/components/history-timeline";
import { useEquipmentDetail } from "~/features/equipment/hooks/use-equipment-detail";
import { equipmentLabels } from "~/features/equipment/labels";

/**
 * Equipment detail page.
 *
 * WHY: After finding equipment in the list, staff need to see all details,
 * status history, and maintenance schedule to make informed decisions about
 * borrowing, maintenance scheduling, or status updates.
 */
export default function EquipmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { equipment, isLoading, history, historyLoading, loadMoreHistory } =
    useEquipmentDetail(id ? (id as Id<"equipment">) : undefined);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <span className="text-muted-foreground">/</span>
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg font-medium">
          {equipmentLabels.notFound.vi}{" "}
          <span className="text-muted-foreground text-base font-normal">
            ({equipmentLabels.notFound.en})
          </span>
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {equipmentLabels.notFoundDesc.vi}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/hospital/equipment">
            {equipmentLabels.backToList.vi}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/hospital/equipment"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {equipmentLabels.title.vi}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{equipment.nameVi}</span>
      </nav>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{equipment.nameVi}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {equipment.nameEn}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/hospital/equipment/${equipment._id}/edit`}>
            {equipmentLabels.edit.vi}
          </Link>
        </Button>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Equipment detail (left/main column) */}
        <div className="space-y-6 lg:col-span-2">
          <EquipmentDetail equipment={equipment} />
        </div>

        {/* Right column: QR code + History timeline */}
        <div className="space-y-6">
          {/* QR Code */}
          <EquipmentQR
            equipmentId={equipment._id}
            equipmentName={equipment.nameVi}
          />

          {/* History timeline */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold">
              {equipmentLabels.history.vi}{" "}
              <span className="text-muted-foreground font-normal">
                ({equipmentLabels.history.en})
              </span>
            </h2>
            <HistoryTimeline
              history={history}
              isLoading={historyLoading}
              onLoadMore={loadMoreHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
