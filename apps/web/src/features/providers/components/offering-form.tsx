"use client";

/**
 * Form component for creating or editing a service offering.
 *
 * WHY: Providers need to create and update service offerings. This form handles
 * both create and edit modes to avoid code duplication. The specialty select
 * ensures only valid specialties (matching Convex schema) can be submitted.
 */
import { useState } from "react";
import { api } from "@medilink/db/api";
import { useMutation } from "convex/react";

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

import type { ServiceOffering, Specialty } from "../types";
import { providerLabels } from "../labels";
import { SPECIALTY_OPTIONS } from "../types";

// Convex codegen does not include providers namespace locally -- cast is safe,
// all argument shapes are validated by the Convex schema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
const providersApi = api.providers as any;

interface OfferingFormProps {
  mode: "create" | "edit";
  /** Existing offering (required in edit mode) */
  offering?: ServiceOffering;
  /** Organization ID (required in create mode) */
  organizationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  locale?: "vi" | "en";
}

interface OfferingFormState {
  specialty: Specialty | "";
  descriptionVi: string;
  descriptionEn: string;
  priceEstimate: string;
  turnaroundDays: string;
}

const DEFAULT_FORM: OfferingFormState = {
  specialty: "",
  descriptionVi: "",
  descriptionEn: "",
  priceEstimate: "",
  turnaroundDays: "",
};

function offeringToFormState(offering: ServiceOffering): OfferingFormState {
  return {
    specialty: offering.specialty,
    descriptionVi: offering.descriptionVi ?? "",
    descriptionEn: offering.descriptionEn ?? "",
    priceEstimate: offering.priceEstimate?.toString() ?? "",
    turnaroundDays: offering.turnaroundDays?.toString() ?? "",
  };
}

/**
 * OfferingForm handles both creating and editing service offerings.
 * In create mode, it calls addServiceOffering mutation.
 * In edit mode, it calls updateServiceOffering mutation.
 */
export function OfferingForm({
  mode,
  offering,
  organizationId,
  onSuccess,
  onCancel,
  locale = "vi",
}: OfferingFormProps) {
  const [form, setForm] = useState<OfferingFormState>(
    mode === "edit" && offering ? offeringToFormState(offering) : DEFAULT_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const addOffering = useMutation(providersApi.addServiceOffering);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const updateOffering = useMutation(providersApi.updateServiceOffering);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.specialty) {
      setError(
        locale === "vi"
          ? "Vui lòng chọn chuyên ngành"
          : "Please select a specialty",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await addOffering({
          organizationId,
          specialty: form.specialty,
          descriptionVi: form.descriptionVi || undefined,
          descriptionEn: form.descriptionEn || undefined,
          priceEstimate: form.priceEstimate
            ? parseFloat(form.priceEstimate)
            : undefined,
          turnaroundDays: form.turnaroundDays
            ? parseInt(form.turnaroundDays, 10)
            : undefined,
        });
      } else if (offering) {
        await updateOffering({
          organizationId,
          offeringId: offering._id,
          specialty: form.specialty,
          descriptionVi: form.descriptionVi || undefined,
          descriptionEn: form.descriptionEn || undefined,
          priceEstimate: form.priceEstimate
            ? parseFloat(form.priceEstimate)
            : undefined,
          turnaroundDays: form.turnaroundDays
            ? parseInt(form.turnaroundDays, 10)
            : undefined,
        });
      }

      onSuccess?.();
    } catch {
      setError(
        locale === "vi"
          ? providerLabels.errors.generic.vi
          : providerLabels.errors.generic.en,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid="offering-form"
    >
      {/* Specialty select */}
      <div className="space-y-1.5">
        <Label htmlFor="specialty">
          {providerLabels.offerings.specialty[locale]}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select
          value={form.specialty}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, specialty: value as Specialty }))
          }
        >
          <SelectTrigger id="specialty">
            <SelectValue
              placeholder={
                locale === "vi" ? "Chọn chuyên ngành..." : "Select specialty..."
              }
            />
          </SelectTrigger>
          <SelectContent>
            {SPECIALTY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {locale === "vi" ? opt.labelVi : opt.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description Vietnamese */}
      <div className="space-y-1.5">
        <Label htmlFor="descriptionVi">
          {providerLabels.offerings.descriptionVi[locale]}
        </Label>
        <textarea
          id="descriptionVi"
          className="border-input bg-background placeholder:text-muted-foreground flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          value={form.descriptionVi}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, descriptionVi: e.target.value }))
          }
          rows={3}
        />
      </div>

      {/* Description English */}
      <div className="space-y-1.5">
        <Label htmlFor="descriptionEn">
          {providerLabels.offerings.descriptionEn[locale]}
        </Label>
        <textarea
          id="descriptionEn"
          className="border-input bg-background placeholder:text-muted-foreground flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          value={form.descriptionEn}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, descriptionEn: e.target.value }))
          }
          rows={3}
        />
      </div>

      {/* Price estimate */}
      <div className="space-y-1.5">
        <Label htmlFor="priceEstimate">
          {providerLabels.offerings.priceEstimate[locale]}
        </Label>
        <Input
          id="priceEstimate"
          type="number"
          min={0}
          value={form.priceEstimate}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, priceEstimate: e.target.value }))
          }
          placeholder={providerLabels.offerings.pricePlaceholder[locale]}
        />
      </div>

      {/* Turnaround days */}
      <div className="space-y-1.5">
        <Label htmlFor="turnaroundDays">
          {providerLabels.offerings.turnaroundDays[locale]}
        </Label>
        <Input
          id="turnaroundDays"
          type="number"
          min={1}
          value={form.turnaroundDays}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, turnaroundDays: e.target.value }))
          }
          placeholder={providerLabels.offerings.turnaroundPlaceholder[locale]}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {providerLabels.actions.cancel[locale]}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? providerLabels.actions.saving[locale]
            : mode === "create"
              ? providerLabels.actions.create[locale]
              : providerLabels.actions.save[locale]}
        </Button>
      </div>
    </form>
  );
}
