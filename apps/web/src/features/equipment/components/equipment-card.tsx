"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@medilink/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@medilink/ui/dropdown-menu";

import { equipmentLabels } from "../labels";
import type { Equipment } from "../types";
import { StatusBadge } from "./status-badge";

interface EquipmentCardProps {
  equipment: Equipment;
}

function getCriticalityColor(criticality: string): string {
  switch (criticality) {
    case "A":
      return "bg-red-100 text-red-700 border-red-200";
    case "B":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "C":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "";
  }
}

/**
 * Equipment card for mobile/tablet view.
 *
 * WHY: The DataTable is hard to navigate on small screens. Cards provide a
 * touch-friendly alternative layout for hospital floor tablet use where staff
 * scan equipment status quickly while moving between wards.
 */
export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const router = useRouter();

  function handleViewDetail() {
    router.push(`/hospital/equipment/${equipment._id}`);
  }

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleViewDetail}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{equipment.nameVi}</h3>
            <p className="text-muted-foreground truncate text-xs">
              {equipment.nameEn}
            </p>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/hospital/equipment/${equipment._id}`);
                }}
              >
                {equipmentLabels.viewDetail.vi}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/hospital/equipment/${equipment._id}/edit`);
                }}
              >
                {equipmentLabels.edit.vi}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status and criticality badges */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={equipment.status} locale="vi" />
          <Badge
            className={`border text-xs ${getCriticalityColor(equipment.criticality)}`}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
            {equipmentLabels.criticalityValues[equipment.criticality]?.vi ?? equipment.criticality}
          </Badge>
        </div>

        {/* Additional info */}
        <div className="space-y-1 text-xs">
          {equipment.location && (
            <div className="text-muted-foreground flex items-center gap-1">
              <span>{equipmentLabels.location.vi}:</span>
              <span className="font-medium text-foreground">
                {equipment.location}
              </span>
            </div>
          )}
          {equipment.serialNumber && (
            <div className="text-muted-foreground flex items-center gap-1">
              <span>{equipmentLabels.serialNumber.vi}:</span>
              <span className="font-medium text-foreground font-mono">
                {equipment.serialNumber}
              </span>
            </div>
          )}
          {equipment.model && (
            <div className="text-muted-foreground flex items-center gap-1">
              <span>{equipmentLabels.model.vi}:</span>
              <span className="font-medium text-foreground">
                {equipment.model}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
