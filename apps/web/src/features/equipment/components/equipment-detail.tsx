"use client";

import { useState } from "react";

import { useMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@medilink/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";

import { equipmentLabels } from "../labels";
import type { Equipment } from "../types";
import { StatusBadge } from "./status-badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const equipmentApi = api.equipment as any;

// Valid transitions map (mirrors convex/lib/statusMachine.ts)
const VALID_TRANSITIONS: Record<string, string[]> = {
  available: ["in_use", "maintenance", "damaged", "retired"],
  in_use: ["available", "maintenance", "damaged"],
  maintenance: ["available", "damaged"],
  damaged: ["available", "retired"],
  retired: [],
};

type EquipmentStatus = "available" | "in_use" | "maintenance" | "damaged" | "retired";

interface EquipmentDetailProps {
  equipment: Equipment;
}

function formatDate(epochMs: number | undefined): string {
  if (!epochMs) return "—";
  return new Date(epochMs).toLocaleDateString("vi-VN");
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 text-sm">
      <span className="text-muted-foreground min-w-0 flex-1">{label}</span>
      <span className="ml-4 min-w-0 flex-1 text-right font-medium">
        {value ?? "—"}
      </span>
    </div>
  );
}

/**
 * Equipment detail display with status update quick actions.
 *
 * WHY: Showing all equipment fields in organized sections (general, technical,
 * dates) helps staff find information quickly. Status update respects the
 * state machine to prevent invalid transitions (e.g. retired → available).
 */
export function EquipmentDetail({ equipment }: EquipmentDetailProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = useMutation(
    equipmentApi.updateStatus as FunctionReference<"mutation">,
  );

  const validTransitions = VALID_TRANSITIONS[equipment.status] ?? [];

  async function handleStatusUpdate() {
    if (!selectedStatus) return;
    setIsUpdating(true);
    try {
      await updateStatus({
        id: equipment._id as Id<"equipment">,
        newStatus: selectedStatus as EquipmentStatus,
        notes: notes || undefined,
      });
      setIsStatusDialogOpen(false);
      setSelectedStatus("");
      setNotes("");
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  }

  const conditionLabel =
    equipmentLabels.conditionValues[
      equipment.condition as keyof typeof equipmentLabels.conditionValues
    ]?.vi ?? equipment.condition;

  const criticalityLabel =
    equipmentLabels.criticalityValues[
      equipment.criticality as keyof typeof equipmentLabels.criticalityValues
    ]?.vi ?? equipment.criticality;

  return (
    <div className="space-y-6">
      {/* Status and quick actions */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={equipment.status} locale="vi" />
        {validTransitions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStatusDialogOpen(true)}
          >
            {equipmentLabels.updateStatus.vi}
          </Button>
        )}
      </div>

      {/* General information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {equipmentLabels.generalInfo.vi}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <FieldRow label={equipmentLabels.nameVi.vi} value={equipment.nameVi} />
          <FieldRow label={equipmentLabels.nameEn.vi} value={equipment.nameEn} />
          {equipment.descriptionVi && (
            <FieldRow
              label={equipmentLabels.descriptionVi.vi}
              value={equipment.descriptionVi}
            />
          )}
          <FieldRow
            label={equipmentLabels.condition.vi}
            value={conditionLabel}
          />
          <FieldRow
            label={equipmentLabels.criticality.vi}
            value={
              <Badge variant="outline" className="text-xs">
                {equipment.criticality} - {criticalityLabel}
              </Badge>
            }
          />
          <FieldRow label={equipmentLabels.location.vi} value={equipment.location} />
        </CardContent>
      </Card>

      {/* Technical details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {equipmentLabels.technicalInfo.vi}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <FieldRow
            label={equipmentLabels.serialNumber.vi}
            value={equipment.serialNumber}
          />
          <FieldRow label={equipmentLabels.model.vi} value={equipment.model} />
          <FieldRow
            label={equipmentLabels.manufacturer.vi}
            value={equipment.manufacturer}
          />
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {equipmentLabels.dateInfo.vi}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <FieldRow
            label={equipmentLabels.purchaseDate.vi}
            value={formatDate(equipment.purchaseDate)}
          />
          <FieldRow
            label={equipmentLabels.warrantyExpiry.vi}
            value={formatDate(equipment.warrantyExpiryDate)}
          />
        </CardContent>
      </Card>

      {/* Status update dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{equipmentLabels.updateStatusTitle.vi}</DialogTitle>
            <DialogDescription>
              {equipmentLabels.status.vi}:{" "}
              <StatusBadge status={equipment.status} locale="vi" />
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {equipmentLabels.newStatus.vi}
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={`${equipmentLabels.filterByStatus.vi}...`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {validTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {equipmentLabels.statusValues[
                        status as EquipmentStatus
                      ]?.vi ?? status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {equipmentLabels.updateNotes.vi}
              </label>
              <textarea
                className="border-input w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
                placeholder={equipmentLabels.updateNotesPlaceholder.vi}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              {equipmentLabels.cancel.vi}
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={!selectedStatus || isUpdating}
            >
              {isUpdating
                ? equipmentLabels.loading.vi
                : equipmentLabels.confirm.vi}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
