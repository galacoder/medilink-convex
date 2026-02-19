"use client";

/**
 * CompletionReportForm component — structured data form for service completion.
 *
 * WHY: Completion reports are stored as structured data (not free text) to support
 * M3-4 analytics (parts inventory, labor hours, maintenance scheduling). This form
 * enforces the required fields while keeping the UX simple for on-site mobile use.
 *
 * Bilingual field labels follow the project standard (Vietnamese primary, English secondary).
 * Large input areas accommodate detailed work descriptions from technicians.
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
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";
import { Textarea } from "@medilink/ui/textarea";

import type { CompletionReportInput } from "../types";
import { serviceExecutionLabels } from "../labels";

interface CompletionReportFormProps {
  serviceRequestId: string;
  onSubmit: (data: CompletionReportInput) => void;
  isSubmitting: boolean;
}

export function CompletionReportForm({
  serviceRequestId,
  onSubmit,
  isSubmitting,
}: CompletionReportFormProps) {
  const [workDescriptionVi, setWorkDescriptionVi] = useState("");
  const [partsReplacedText, setPartsReplacedText] = useState("");
  const [nextMaintenanceRecommendation, setNextMaintenanceRecommendation] =
    useState("");
  const [actualHours, setActualHours] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation
    if (workDescriptionVi.trim().length < 20) {
      setValidationError(
        "Mô tả công việc phải có ít nhất 20 ký tự (Work description must be at least 20 characters)",
      );
      return;
    }

    setValidationError(null);

    // Parse parts replaced (one per line)
    const partsReplaced = partsReplacedText
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Parse actual hours
    const parsedHours = actualHours ? parseFloat(actualHours) : undefined;

    onSubmit({
      serviceRequestId,
      workDescriptionVi: workDescriptionVi.trim(),
      partsReplaced: partsReplaced.length > 0 ? partsReplaced : undefined,
      nextMaintenanceRecommendation:
        nextMaintenanceRecommendation.trim() || undefined,
      actualHours: parsedHours && !isNaN(parsedHours) ? parsedHours : undefined,
    });
  }

  return (
    <Card data-testid="completion-report-form">
      <CardHeader>
        <CardTitle>
          {serviceExecutionLabels.page.completionReport.vi}{" "}
          {/* {serviceExecutionLabels.page.completionReport.en} */}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Work description (required) */}
          <div className="space-y-2">
            <Label htmlFor="work-description">
              {serviceExecutionLabels.form.workDescription.vi}
              {" *"}
              {/* {serviceExecutionLabels.form.workDescription.en} */}
            </Label>
            <Textarea
              id="work-description"
              placeholder={
                serviceExecutionLabels.form.workDescriptionPlaceholder.vi
              }
              value={workDescriptionVi}
              onChange={(e) => setWorkDescriptionVi(e.target.value)}
              rows={4}
              data-testid="work-description-input"
              disabled={isSubmitting}
            />
          </div>

          {/* Parts replaced (optional) */}
          <div className="space-y-2">
            <Label htmlFor="parts-replaced">
              {serviceExecutionLabels.form.partsReplaced.vi}{" "}
              {/* {serviceExecutionLabels.form.partsReplaced.en} */}
            </Label>
            <Textarea
              id="parts-replaced"
              placeholder={
                serviceExecutionLabels.form.partsReplacedPlaceholder.vi
              }
              value={partsReplacedText}
              onChange={(e) => setPartsReplacedText(e.target.value)}
              rows={3}
              data-testid="parts-replaced-input"
              disabled={isSubmitting}
            />
          </div>

          {/* Next maintenance recommendation (optional) */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-recommendation">
              {serviceExecutionLabels.form.nextMaintenance.vi}{" "}
              {/* {serviceExecutionLabels.form.nextMaintenance.en} */}
            </Label>
            <Input
              id="maintenance-recommendation"
              type="text"
              placeholder={
                serviceExecutionLabels.form.nextMaintenancePlaceholder.vi
              }
              value={nextMaintenanceRecommendation}
              onChange={(e) => setNextMaintenanceRecommendation(e.target.value)}
              data-testid="maintenance-recommendation-input"
              disabled={isSubmitting}
            />
          </div>

          {/* Actual hours (optional, for hourly pricing) */}
          <div className="space-y-2">
            <Label htmlFor="actual-hours">
              {serviceExecutionLabels.form.actualHours.vi}{" "}
              {/* {serviceExecutionLabels.form.actualHours.en} */}
            </Label>
            <Input
              id="actual-hours"
              type="number"
              step="0.5"
              min="0"
              placeholder={
                serviceExecutionLabels.form.actualHoursPlaceholder.vi
              }
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              data-testid="actual-hours-input"
              disabled={isSubmitting}
            />
          </div>

          {/* Validation error */}
          {validationError && (
            <p
              className="text-destructive text-sm"
              data-testid="validation-error"
            >
              {validationError}
            </p>
          )}
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
            data-testid="submit-report-btn"
          >
            {isSubmitting
              ? "Đang gửi..." /* Submitting... */
              : serviceExecutionLabels.actions.submitReport.vi}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
