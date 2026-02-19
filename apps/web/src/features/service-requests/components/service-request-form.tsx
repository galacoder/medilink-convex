"use client";

/**
 * ServiceRequestForm — 3-step wizard for creating service requests.
 *
 * WHY: Multi-step form prevents overwhelming hospital staff with too many
 * fields at once. Each step validates before advancing so errors are
 * caught early. State is accumulated across steps and passed to onSubmit
 * only when all validation passes (on step 3 submit).
 *
 * Steps:
 *   1. Select equipment from org inventory
 *   2. Describe issue (type, priority, description, optional scheduled date)
 *   3. Review and submit
 */
import { useState } from "react";

import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";

import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";
import type {
  CreateServiceRequestInput,
  ServiceRequestPriority,
  ServiceRequestType,
} from "../types";
import { SERVICE_REQUEST_PRIORITIES, SERVICE_REQUEST_TYPES } from "../types";
import { EquipmentSelector } from "./equipment-selector";

interface ServiceRequestFormProps {
  /** Called when the user submits the form on step 3 */
  onSubmit: (data: Omit<CreateServiceRequestInput, "organizationId">) => Promise<void>;
  /** Optional organization ID (can be injected by the page) */
  organizationId?: string;
}

interface FormState {
  equipmentId: string;
  equipmentNameVi: string;
  type: ServiceRequestType;
  priority: ServiceRequestPriority;
  descriptionVi: string;
  descriptionEn: string;
  scheduledAt?: number;
}

const initialState: FormState = {
  equipmentId: "",
  equipmentNameVi: "",
  type: "repair",
  priority: "medium",
  descriptionVi: "",
  descriptionEn: "",
};

const labels = serviceRequestLabels;

export function ServiceRequestForm({
  onSubmit,
  organizationId: _organizationId = "",
}: ServiceRequestFormProps) {
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Step validation
  // ---------------------------------------------------------------------------

  function validateStep1(): boolean {
    if (!formState.equipmentId) {
      setErrors({ equipmentId: labels.errors.equipmentRequired.vi });
      return false;
    }
    setErrors({});
    return true;
  }

  function validateStep2(): boolean {
    if (!formState.descriptionVi.trim()) {
      setErrors({ descriptionVi: labels.errors.descriptionRequired.vi });
      return false;
    }
    setErrors({});
    return true;
  }

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  function handleBack() {
    setErrors({});
    if (step > 1) setStep(step - 1);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await onSubmit({
        equipmentId: formState.equipmentId,
        type: formState.type,
        priority: formState.priority,
        descriptionVi: formState.descriptionVi,
        descriptionEn: formState.descriptionEn || undefined,
        scheduledAt: formState.scheduledAt,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Card>
      {/* Step indicator */}
      <CardHeader>
        <CardTitle className="text-base">
          {step === 1 && labels.form.steps.equipment.vi}
          {step === 2 && labels.form.steps.issue.vi}
          {step === 3 && labels.form.steps.review.vi}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {labels.pages.create.vi} — {labels.common.loading.vi.replace("...", "")}
          {step}/3
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step 1: Equipment selection */}
        {step === 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {labels.form.equipment.vi}
            </label>
            <EquipmentSelector
              value={formState.equipmentId}
              onSelect={(id, nameVi) =>
                setFormState((prev) => ({
                  ...prev,
                  equipmentId: id,
                  equipmentNameVi: nameVi,
                }))
              }
            />
            {errors.equipmentId && (
              <p className="text-destructive text-sm">{errors.equipmentId}</p>
            )}
          </div>
        )}

        {/* Step 2: Issue details */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Service type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {labels.form.issueType.vi}
              </label>
              <Select
                value={formState.type}
                onValueChange={(v) =>
                  setFormState((prev) => ({
                    ...prev,
                    type: v as ServiceRequestType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_REQUEST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label.vi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {labels.form.priority.vi}
              </label>
              <Select
                value={formState.priority}
                onValueChange={(v) =>
                  setFormState((prev) => ({
                    ...prev,
                    priority: v as ServiceRequestPriority,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_REQUEST_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label.vi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description (Vietnamese) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {labels.form.description.vi}
              </label>
              <textarea
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={labels.form.descriptionPlaceholder.vi}
                value={formState.descriptionVi}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    descriptionVi: e.target.value,
                  }))
                }
              />
              {errors.descriptionVi && (
                <p className="text-destructive text-sm">
                  {errors.descriptionVi}
                </p>
              )}
            </div>

            {/* Description (English, optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {labels.form.descriptionEn.vi}
              </label>
              <textarea
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={labels.form.descriptionEnPlaceholder.vi}
                value={formState.descriptionEn}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    descriptionEn: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {labels.form.reviewTitle.vi}
            </h3>
            <div className="rounded-md border p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {labels.form.equipment.vi}
                </span>
                <span className="font-medium">{formState.equipmentNameVi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {labels.form.issueType.vi}
                </span>
                <span>
                  {labels.type[formState.type].vi}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {labels.form.priority.vi}
                </span>
                <span>
                  {labels.priority[formState.priority].vi}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {labels.form.description.vi}
                </span>
                <p className="mt-1 whitespace-pre-wrap">{formState.descriptionVi}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
            {labels.buttons.back.vi}
          </Button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <Button onClick={handleNext}>
            {labels.buttons.next.vi}
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? labels.buttons.submitting.vi
              : labels.buttons.submit.vi}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
