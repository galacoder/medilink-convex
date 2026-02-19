"use client";

/**
 * EquipmentSelector component — searchable select for hospital equipment.
 *
 * WHY: Hospital staff need to select which piece of equipment requires
 * service. Queries the org's equipment via Convex and renders a Select
 * dropdown with Vietnamese name (primary), serial number, and status badge.
 *
 * Only shows available and in_use equipment (damaged/retired not shown since
 * they may already have service requests or be decommissioned).
 */
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";

import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";

/** Minimal equipment shape returned from api.equipment.list pagination */
interface EquipmentItem {
  _id: string;
  nameVi: string;
  serialNumber?: string | null;
}

interface EquipmentSelectorProps {
  value: string;
  onSelect: (equipmentId: string, nameVi: string) => void;
}

const labels = serviceRequestLabels;

export function EquipmentSelector({ value, onSelect }: EquipmentSelectorProps) {
  // Query all available equipment for this org (no status filter = all statuses)
  const equipmentResult = useQuery(api.equipment.list, {
    paginationOpts: { numItems: 100, cursor: null },
  }) as { page?: EquipmentItem[] } | undefined;

  const equipment: EquipmentItem[] = equipmentResult?.page ?? [];

  function handleValueChange(id: string) {
    const item = equipment.find((e) => e._id === id);
    if (item) {
      onSelect(id, item.nameVi);
    }
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue
          placeholder={labels.form.equipmentPlaceholder.vi}
        />
      </SelectTrigger>
      <SelectContent>
        {equipment.length === 0 && (
          <SelectItem value="__empty__" disabled>
            {labels.common.loading.vi}
          </SelectItem>
        )}
        {equipment.map((item) => (
          <SelectItem key={item._id} value={item._id}>
            <span className="font-medium">{item.nameVi}</span>
            {item.serialNumber && (
              <span className="text-muted-foreground ml-2 text-xs">
                SN: {item.serialNumber}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
