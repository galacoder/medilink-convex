"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import type { Id } from "@medilink/backend";
import { Skeleton } from "@medilink/ui/skeleton";

import { EquipmentForm } from "~/features/equipment/components/equipment-form";
import { useEquipmentDetail } from "~/features/equipment/hooks/use-equipment-detail";
import { equipmentLabels } from "~/features/equipment/labels";

/**
 * Equipment edit page.
 *
 * WHY: Allows staff to update equipment details (not status — that's done via
 * quick actions on the detail page). Prefills the form with existing data.
 */
export default function EquipmentEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { equipment, isLoading } = useEquipmentDetail(
    id ? (id as Id<"equipment">) : undefined,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="text-muted-foreground py-16 text-center">
        Không tìm thấy thiết bị {/* Equipment not found */}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/hospital/equipment"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {equipmentLabels.title.vi}
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          href={`/hospital/equipment/${equipment._id}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {equipment.nameVi}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{equipmentLabels.edit.vi}</span>
      </nav>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">
          {equipmentLabels.editEquipment.vi}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{equipment.nameVi}</p>
      </div>

      {/* Edit form */}
      <EquipmentForm
        mode="edit"
        equipment={equipment}
        onSuccess={(id) => router.push(`/hospital/equipment/${id}`)}
        onCancel={() => router.push(`/hospital/equipment/${equipment._id}`)}
      />
    </div>
  );
}
