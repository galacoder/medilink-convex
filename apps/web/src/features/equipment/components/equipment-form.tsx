"use client";

import { useState } from "react";

import { useMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";

import { equipmentLabels } from "../labels";
import type { Equipment } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const equipmentApi = api.equipment as any;
// Pre-cast function references to avoid per-call unsafe-member-access errors
const createFn: FunctionReference<"mutation"> = equipmentApi.create;
const updateFn: FunctionReference<"mutation"> = equipmentApi.update;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

interface EquipmentFormData {
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  categoryId: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  status: string;
  condition: string;
  criticality: string;
  location: string;
  purchaseDate: string;
  warrantyExpiryDate: string;
}

interface EquipmentFormProps {
  mode: "create" | "edit";
  /** Existing equipment (required in edit mode) */
  equipment?: Equipment;
  /** Organization ID (required in create mode) */
  organizationId?: string;
  onSuccess?: (id: Id<"equipment">) => void;
  onCancel?: () => void;
}

type EquipmentStatus = "available" | "in_use" | "maintenance" | "damaged" | "retired";
type EquipmentCondition = "excellent" | "good" | "fair" | "poor";
type Criticality = "A" | "B" | "C";

const DEFAULT_FORM: EquipmentFormData = {
  nameVi: "",
  nameEn: "",
  descriptionVi: "",
  descriptionEn: "",
  categoryId: "",
  serialNumber: "",
  model: "",
  manufacturer: "",
  status: "available",
  condition: "good",
  criticality: "B",
  location: "",
  purchaseDate: "",
  warrantyExpiryDate: "",
};

function equipmentToFormData(equipment: Equipment): EquipmentFormData {
  return {
    nameVi: equipment.nameVi,
    nameEn: equipment.nameEn,
    descriptionVi: equipment.descriptionVi ?? "",
    descriptionEn: equipment.descriptionEn ?? "",
    categoryId: equipment.categoryId,
    serialNumber: equipment.serialNumber ?? "",
    model: equipment.model ?? "",
    manufacturer: equipment.manufacturer ?? "",
    status: equipment.status,
    condition: equipment.condition,
    criticality: equipment.criticality,
    location: equipment.location ?? "",
    purchaseDate: equipment.purchaseDate
      ? new Date(equipment.purchaseDate).toISOString().split("T")[0] ?? ""
      : "",
    warrantyExpiryDate: equipment.warrantyExpiryDate
      ? new Date(equipment.warrantyExpiryDate).toISOString().split("T")[0] ?? ""
      : "",
  };
}

interface FieldErrors {
  nameVi?: string;
  nameEn?: string;
  categoryId?: string;
  status?: string;
  condition?: string;
  criticality?: string;
}

function validateForm(data: EquipmentFormData, mode: "create" | "edit"): FieldErrors {
  const errors: FieldErrors = {};

  if (!data.nameVi || data.nameVi.length < 2) {
    errors.nameVi =
      "Tên thiết bị phải có ít nhất 2 ký tự (Equipment name must be at least 2 characters)";
  }
  if (!data.nameEn || data.nameEn.length < 2) {
    errors.nameEn =
      "English name must be at least 2 characters (Tên tiếng Anh phải có ít nhất 2 ký tự)";
  }
  if (mode === "create" && !data.categoryId) {
    errors.categoryId =
      "ID danh mục không được để trống (Category ID is required)";
  }

  return errors;
}

/**
 * Equipment create/edit form with Zod-compatible validation.
 *
 * WHY: The form supports both create and edit modes via the mode prop,
 * reducing duplication. Bilingual validation error messages match the
 * Zod schemas in @medilink/validators so error UX is consistent.
 */
export function EquipmentForm({
  mode,
  equipment,
  organizationId,
  onSuccess,
  onCancel,
}: EquipmentFormProps) {
  const initialData =
    mode === "edit" && equipment
      ? equipmentToFormData(equipment)
      : DEFAULT_FORM;

  const [formData, setFormData] = useState<EquipmentFormData>(initialData);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const createMutation = useMutation(createFn);
  const updateMutation = useMutation(updateFn);

  function handleChange(
    field: keyof EquipmentFormData,
    value: string,
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const fieldErrors = validateForm(formData, mode);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const purchaseDateMs = formData.purchaseDate
        ? new Date(formData.purchaseDate).getTime()
        : undefined;
      const warrantyMs = formData.warrantyExpiryDate
        ? new Date(formData.warrantyExpiryDate).getTime()
        : undefined;

      if (mode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const newId = await createMutation({
          nameVi: formData.nameVi,
          nameEn: formData.nameEn,
          descriptionVi: formData.descriptionVi || undefined,
          descriptionEn: formData.descriptionEn || undefined,
          categoryId: formData.categoryId as Id<"equipmentCategories">,
          organizationId: organizationId as Id<"organizations">,
          status: formData.status as EquipmentStatus,
          condition: formData.condition as EquipmentCondition,
          criticality: formData.criticality as Criticality,
          serialNumber: formData.serialNumber || undefined,
          model: formData.model || undefined,
          manufacturer: formData.manufacturer || undefined,
          location: formData.location || undefined,
          purchaseDate: purchaseDateMs,
          warrantyExpiryDate: warrantyMs,
        });
        setFeedback({
          type: "success",
          message: equipmentLabels.createSuccess.vi,
        });
        if (onSuccess && newId) {
          onSuccess(newId as Id<"equipment">);
        }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (mode === "edit" && equipment) {
        await updateMutation({
          id: equipment._id as Id<"equipment">,
          nameVi: formData.nameVi,
          nameEn: formData.nameEn,
          descriptionVi: formData.descriptionVi || undefined,
          descriptionEn: formData.descriptionEn || undefined,
          categoryId: formData.categoryId as Id<"equipmentCategories">,
          condition: formData.condition as EquipmentCondition,
          criticality: formData.criticality as Criticality,
          serialNumber: formData.serialNumber || undefined,
          model: formData.model || undefined,
          manufacturer: formData.manufacturer || undefined,
          location: formData.location || undefined,
          purchaseDate: purchaseDateMs,
          warrantyExpiryDate: warrantyMs,
        });
        setFeedback({
          type: "success",
          message: equipmentLabels.updateSuccess.vi,
        });
        if (onSuccess && equipment._id) {
          onSuccess(equipment._id as Id<"equipment">);
        }
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : equipmentLabels.error.vi,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Vietnamese name */}
      <div className="space-y-1.5">
        <Label htmlFor="nameVi">
          {equipmentLabels.nameVi.vi}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            ({equipmentLabels.nameVi.en})
          </span>
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="nameVi"
          value={formData.nameVi}
          onChange={(e) => handleChange("nameVi", e.target.value)}
          placeholder={`${equipmentLabels.placeholders.nameVi.vi} / ${equipmentLabels.placeholders.nameVi.en}`}
          aria-invalid={!!errors.nameVi}
        />
        {errors.nameVi && (
          <p className="text-destructive text-xs">{errors.nameVi}</p>
        )}
      </div>

      {/* English name */}
      <div className="space-y-1.5">
        <Label htmlFor="nameEn">
          {equipmentLabels.nameEn.vi}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            ({equipmentLabels.nameEn.en})
          </span>
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="nameEn"
          value={formData.nameEn}
          onChange={(e) => handleChange("nameEn", e.target.value)}
          placeholder={`${equipmentLabels.placeholders.nameEn.en} / ${equipmentLabels.placeholders.nameEn.vi}`}
          aria-invalid={!!errors.nameEn}
        />
        {errors.nameEn && (
          <p className="text-destructive text-xs">{errors.nameEn}</p>
        )}
      </div>

      {/* Category ID */}
      <div className="space-y-1.5">
        <Label htmlFor="categoryId">
          {equipmentLabels.category.vi}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            ({equipmentLabels.category.en})
          </span>
          {mode === "create" && (
            <span className="text-destructive ml-1">*</span>
          )}
        </Label>
        <Input
          id="categoryId"
          value={formData.categoryId}
          onChange={(e) => handleChange("categoryId", e.target.value)}
          placeholder={`${equipmentLabels.placeholders.categoryId.vi} / ${equipmentLabels.placeholders.categoryId.en}`}
          aria-invalid={!!errors.categoryId}
        />
        {errors.categoryId && (
          <p className="text-destructive text-xs">{errors.categoryId}</p>
        )}
      </div>

      {/* Status (create mode only) */}
      {mode === "create" && (
        <div className="space-y-1.5">
          <Label htmlFor="status">
            {equipmentLabels.status.vi}{" "}
            <span className="text-muted-foreground text-xs font-normal">
              ({equipmentLabels.status.en})
            </span>
          </Label>
          <Select
            value={formData.status}
            onValueChange={(v) => handleChange("status", v)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["available", "in_use", "maintenance", "damaged", "retired"] as const).map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {equipmentLabels.statusValues[s].vi}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Condition */}
      <div className="space-y-1.5">
        <Label htmlFor="condition">
          {equipmentLabels.condition.vi}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            ({equipmentLabels.condition.en})
          </span>
        </Label>
        <Select
          value={formData.condition}
          onValueChange={(v) => handleChange("condition", v)}
        >
          <SelectTrigger id="condition">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["excellent", "good", "fair", "poor"] as const).map((c) => (
              <SelectItem key={c} value={c}>
                {equipmentLabels.conditionValues[c].vi}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Criticality */}
      <div className="space-y-1.5">
        <Label htmlFor="criticality">
          {equipmentLabels.criticality.vi}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            ({equipmentLabels.criticality.en})
          </span>
        </Label>
        <Select
          value={formData.criticality}
          onValueChange={(v) => handleChange("criticality", v)}
        >
          <SelectTrigger id="criticality">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["A", "B", "C"] as const).map((c) => (
              <SelectItem key={c} value={c}>
                {c} — {equipmentLabels.criticalityValues[c].vi}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Serial number */}
      <div className="space-y-1.5">
        <Label htmlFor="serialNumber">
          {equipmentLabels.serialNumber.vi}
        </Label>
        <Input
          id="serialNumber"
          value={formData.serialNumber}
          onChange={(e) => handleChange("serialNumber", e.target.value)}
        />
      </div>

      {/* Model */}
      <div className="space-y-1.5">
        <Label htmlFor="model">{equipmentLabels.model.vi}</Label>
        <Input
          id="model"
          value={formData.model}
          onChange={(e) => handleChange("model", e.target.value)}
        />
      </div>

      {/* Manufacturer */}
      <div className="space-y-1.5">
        <Label htmlFor="manufacturer">
          {equipmentLabels.manufacturer.vi}
        </Label>
        <Input
          id="manufacturer"
          value={formData.manufacturer}
          onChange={(e) => handleChange("manufacturer", e.target.value)}
        />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location">{equipmentLabels.location.vi}</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder={`${equipmentLabels.placeholders.location.vi} / ${equipmentLabels.placeholders.location.en}`}
        />
      </div>

      {/* Purchase date */}
      <div className="space-y-1.5">
        <Label htmlFor="purchaseDate">
          {equipmentLabels.purchaseDate.vi}
        </Label>
        <Input
          id="purchaseDate"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => handleChange("purchaseDate", e.target.value)}
        />
      </div>

      {/* Warranty expiry date */}
      <div className="space-y-1.5">
        <Label htmlFor="warrantyExpiryDate">
          {equipmentLabels.warrantyExpiry.vi}
        </Label>
        <Input
          id="warrantyExpiryDate"
          type="date"
          value={formData.warrantyExpiryDate}
          onChange={(e) => handleChange("warrantyExpiryDate", e.target.value)}
        />
      </div>

      {/* Description Vietnamese */}
      <div className="space-y-1.5">
        <Label htmlFor="descriptionVi">
          {equipmentLabels.descriptionVi.vi}
        </Label>
        <textarea
          id="descriptionVi"
          className="border-input w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          value={formData.descriptionVi}
          onChange={(e) => handleChange("descriptionVi", e.target.value)}
        />
      </div>

      {/* Description English */}
      <div className="space-y-1.5">
        <Label htmlFor="descriptionEn">
          {equipmentLabels.descriptionEn.vi}
        </Label>
        <textarea
          id="descriptionEn"
          className="border-input w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          value={formData.descriptionEn}
          onChange={(e) => handleChange("descriptionEn", e.target.value)}
        />
      </div>

      {/* Form actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {equipmentLabels.cancel.vi}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? equipmentLabels.loading.vi
            : mode === "create"
              ? equipmentLabels.create.vi
              : equipmentLabels.save.vi}
        </Button>
      </div>
    </form>
  );
}
