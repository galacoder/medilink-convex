"use client";

import type { Id } from "convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useActiveOrganization } from "~/auth/client";
import { EquipmentForm } from "~/features/equipment/components/equipment-form";
import { equipmentLabels } from "~/features/equipment/labels";

/**
 * New equipment creation page.
 *
 * WHY: Hospital staff create new equipment entries when new devices arrive.
 * The page grabs the active organization from session so users don't need
 * to manually enter the organization ID.
 */
export default function NewEquipmentPage() {
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();

  const organizationId = activeOrg?.id;

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
        <span className="font-medium">{equipmentLabels.newEquipment.vi}</span>
      </nav>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">
          {equipmentLabels.addEquipment.vi}{" "}
          <span className="text-muted-foreground text-base font-normal">
            ({equipmentLabels.addEquipment.en})
          </span>
        </h1>
      </div>

      {/* Create form */}
      {organizationId ? (
        <EquipmentForm
          mode="create"
          organizationId={organizationId}
          onSuccess={(id: Id<"equipment">) =>
            router.push(`/hospital/equipment/${id}`)
          }
          onCancel={() => router.push("/hospital/equipment")}
        />
      ) : (
        <div className="text-muted-foreground rounded-md border border-dashed px-6 py-10 text-center text-sm">
          {equipmentLabels.loadingOrganization.vi}
        </div>
      )}
    </div>
  );
}
