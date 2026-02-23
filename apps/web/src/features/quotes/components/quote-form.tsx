"use client";

/**
 * QuoteForm component — form for providers to submit a price quote.
 *
 * WHY: The most critical form in the provider portal. Handles VND currency
 * input (displayed with Intl.NumberFormat vi-VN formatting), date selection
 * for start date, estimated duration, and optional notes/terms.
 *
 * Uses AlertDialog confirmation before submitting to prevent accidental
 * quote submissions which cannot be undone easily.
 *
 * Validation: client-side using submitQuoteFormSchema from @medilink/validators.
 * Pattern: matches ServiceRequestForm controlled state approach.
 */
import type { Id } from "@medilink/db/dataModel";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@medilink/ui/alert-dialog";
import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";
import { submitQuoteFormSchema } from "@medilink/validators";

import { useQuoteMutations } from "../hooks/use-quote-mutations";
import { quoteLabels } from "../labels";

interface FormState {
  amount: string;
  estimatedDurationDays: string;
  availableStartDate: string;
  notes: string;
  terms: string;
}

interface FormErrors {
  amount?: string;
  estimatedDurationDays?: string;
  availableStartDate?: string;
}

interface QuoteFormProps {
  serviceRequestId: string;
  onSuccess?: (quoteId: string) => void;
}

/** Formats a number as Vietnamese Dong for display */
function formatVND(amount: number): string {
  if (isNaN(amount) || amount <= 0) return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/** Returns today's date as YYYY-MM-DD for the date input min attribute */
function todayStr(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

/** Returns tomorrow's date as YYYY-MM-DD */
function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0] ?? "";
}

export function QuoteForm({ serviceRequestId, onSuccess }: QuoteFormProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const { submitQuote } = useQuoteMutations();

  const [formState, setFormState] = useState<FormState>({
    amount: "",
    estimatedDurationDays: "1",
    availableStartDate: tomorrowStr(),
    notes: "",
    terms: "",
  });

  const amountNum = parseFloat(formState.amount) || 0;

  function validateForm(): boolean {
    const result = submitQuoteFormSchema.safeParse({
      serviceRequestId,
      amount: amountNum,
      currency: "VND" as const,
      estimatedDurationDays: parseInt(formState.estimatedDurationDays, 10) || 0,
      availableStartDate: formState.availableStartDate
        ? new Date(formState.availableStartDate).getTime()
        : 0,
    });

    if (!result.success) {
      const newErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        newErrors[field] ??= issue.message;
      }
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  }

  function handleOpenConfirm() {
    if (validateForm()) {
      setIsConfirmOpen(true);
    }
  }

  async function handleConfirmedSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const quoteId = await submitQuote({
        serviceRequestId: serviceRequestId as Id<"serviceRequests">,
        amount: amountNum,
        currency: "VND",
        notes: formState.notes.trim() || undefined,
        estimatedDurationDays:
          parseInt(formState.estimatedDurationDays, 10) || undefined,
        availableStartDate: formState.availableStartDate
          ? new Date(formState.availableStartDate).getTime()
          : undefined,
      });
      setIsConfirmOpen(false);
      setFormState({
        amount: "",
        estimatedDurationDays: "1",
        availableStartDate: tomorrowStr(),
        notes: "",
        terms: "",
      });
      onSuccess?.(quoteId);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra. Vui lòng thử lại. (An error occurred. Please try again.)",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear error when user edits the field
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <div className="space-y-4" data-testid="quote-form">
      {/* Amount */}
      <div className="space-y-1">
        <Label htmlFor="quote-amount">{quoteLabels.form.amount.vi}</Label>
        <Input
          id="quote-amount"
          type="number"
          min={1}
          placeholder={quoteLabels.form.amountPlaceholder.vi}
          value={formState.amount}
          onChange={(e) => updateField("amount", e.target.value)}
          data-testid="quote-amount-input"
        />
        {amountNum > 0 && (
          <p className="text-muted-foreground text-xs">
            {formatVND(amountNum)}
          </p>
        )}
        {errors.amount && (
          <p className="text-destructive text-xs">{errors.amount}</p>
        )}
      </div>

      {/* Estimated duration */}
      <div className="space-y-1">
        <Label htmlFor="quote-duration">
          {quoteLabels.form.estimatedDays.vi}
        </Label>
        <Input
          id="quote-duration"
          type="number"
          min={1}
          placeholder={quoteLabels.form.estimatedDaysPlaceholder.vi}
          value={formState.estimatedDurationDays}
          onChange={(e) => updateField("estimatedDurationDays", e.target.value)}
          data-testid="quote-duration-input"
        />
        {errors.estimatedDurationDays && (
          <p className="text-destructive text-xs">
            {errors.estimatedDurationDays}
          </p>
        )}
      </div>

      {/* Available start date */}
      <div className="space-y-1">
        <Label htmlFor="quote-start-date">
          {quoteLabels.form.startDate.vi}
        </Label>
        <Input
          id="quote-start-date"
          type="date"
          value={formState.availableStartDate}
          min={todayStr()}
          onChange={(e) => updateField("availableStartDate", e.target.value)}
          data-testid="quote-start-date-input"
        />
        {errors.availableStartDate && (
          <p className="text-destructive text-xs">
            {errors.availableStartDate}
          </p>
        )}
      </div>

      {/* Notes (optional) */}
      <div className="space-y-1">
        <Label htmlFor="quote-notes">
          {quoteLabels.form.notes.vi}{" "}
          <span className="text-muted-foreground text-xs">(tùy chọn)</span>
        </Label>
        <textarea
          id="quote-notes"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={quoteLabels.form.notesPlaceholder.vi}
          rows={3}
          value={formState.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          data-testid="quote-notes-input"
        />
      </div>

      {/* Terms (optional) */}
      <div className="space-y-1">
        <Label htmlFor="quote-terms">
          {quoteLabels.form.terms.vi}{" "}
          <span className="text-muted-foreground text-xs">(tùy chọn)</span>
        </Label>
        <textarea
          id="quote-terms"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={quoteLabels.form.termsPlaceholder.vi}
          rows={3}
          value={formState.terms}
          onChange={(e) => updateField("terms", e.target.value)}
          data-testid="quote-terms-input"
        />
      </div>

      {submitError && <p className="text-destructive text-sm">{submitError}</p>}

      {/* Submit with confirmation dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            onClick={handleOpenConfirm}
            data-testid="quote-form-submit"
          >
            {quoteLabels.actions.submitQuote.vi}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {quoteLabels.confirmSubmit.title.vi}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {quoteLabels.confirmSubmit.description.vi}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {quoteLabels.actions.cancel.vi}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Đang gửi..."
                : quoteLabels.actions.submitQuote.vi}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
