"use client";

/**
 * EditQuoteForm — inline form for editing a pending quote.
 *
 * WHY: Providers may need to revise their quote (amount, notes, duration)
 * before the hospital makes a decision. This lightweight inline form appears
 * when the provider clicks "Edit" on a pending quote card.
 *
 * Only pending quotes can be edited — the mutation enforces this server-side.
 *
 * vi: "Form chỉnh sửa báo giá" / en: "Edit quote form"
 */
import type { FormEvent } from "react";
import { useState } from "react";

import type { Id } from "convex/_generated/dataModel";

import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";

import { useQuoteMutations } from "../hooks/use-quote-mutations";
import { quoteLabels } from "../labels";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Formats epoch ms as YYYY-MM-DD for date inputs */
function epochToDateStr(epochMs?: number): string {
  if (!epochMs) return "";
  return new Date(epochMs).toISOString().split("T")[0] ?? "";
}

/** Returns tomorrow's date as YYYY-MM-DD */
function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0] ?? "";
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditQuoteFormProps {
  quoteId: string;
  initialAmount: number;
  initialNotes?: string;
  initialEstimatedDurationDays?: number;
  initialAvailableStartDate?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  locale?: "vi" | "en";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Inline edit form for a pending provider quote.
 *
 * Calls api.quotes.update mutation via useQuoteMutations().updateQuote().
 * On success calls onSuccess() so the parent can close/refresh the form.
 *
 * vi: "Chỉnh sửa báo giá đang chờ" / en: "Edit pending quote"
 */
export function EditQuoteForm({
  quoteId,
  initialAmount,
  initialNotes = "",
  initialEstimatedDurationDays,
  initialAvailableStartDate,
  onSuccess,
  onCancel,
  locale = "vi",
}: EditQuoteFormProps) {
  const { updateQuote, isUpdating } = useQuoteMutations();

  const [amount, setAmount] = useState(String(initialAmount));
  const [notes, setNotes] = useState(initialNotes);
  const [estimatedDays, setEstimatedDays] = useState(
    initialEstimatedDurationDays ? String(initialEstimatedDurationDays) : "",
  );
  const [availableStartDate, setAvailableStartDate] = useState(
    epochToDateStr(initialAvailableStartDate) || tomorrowStr(),
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg(
        locale === "vi"
          ? "Số tiền phải lớn hơn 0"
          : "Amount must be greater than 0",
      );
      return;
    }

    try {
      await updateQuote({
        quoteId: quoteId as Id<"quotes">,
        amount: amountNum,
        notes: notes.trim() || undefined,
        estimatedDurationDays: estimatedDays
          ? parseInt(estimatedDays, 10)
          : undefined,
        availableStartDate: availableStartDate
          ? new Date(availableStartDate).getTime()
          : undefined,
      });
      onSuccess?.();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : locale === "vi"
            ? "Cập nhật thất bại. Vui lòng thử lại."
            : "Update failed. Please try again.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border bg-muted/30 p-4"
      data-testid="edit-quote-form"
    >
      {/* Amount */}
      <div>
        <Label htmlFor="edit-quote-amount" className="text-xs">
          {quoteLabels.form.amount[locale]}
        </Label>
        <Input
          id="edit-quote-amount"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1"
          data-testid="edit-quote-amount-input"
          disabled={isUpdating}
        />
      </div>

      {/* Estimated duration */}
      <div>
        <Label htmlFor="edit-quote-duration" className="text-xs">
          {quoteLabels.form.estimatedDays[locale]}
        </Label>
        <Input
          id="edit-quote-duration"
          type="number"
          min={1}
          value={estimatedDays}
          onChange={(e) => setEstimatedDays(e.target.value)}
          className="mt-1"
          data-testid="edit-quote-duration-input"
          disabled={isUpdating}
        />
      </div>

      {/* Available start date */}
      <div>
        <Label htmlFor="edit-quote-start-date" className="text-xs">
          {quoteLabels.form.startDate[locale]}
        </Label>
        <Input
          id="edit-quote-start-date"
          type="date"
          value={availableStartDate}
          min={tomorrowStr()}
          onChange={(e) => setAvailableStartDate(e.target.value)}
          className="mt-1"
          data-testid="edit-quote-start-date-input"
          disabled={isUpdating}
        />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="edit-quote-notes" className="text-xs">
          {quoteLabels.form.notes[locale]}{" "}
          <span className="text-muted-foreground">(tùy chọn)</span>
        </Label>
        <textarea
          id="edit-quote-notes"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          data-testid="edit-quote-notes-input"
          disabled={isUpdating}
        />
      </div>

      {errorMsg && (
        <p className="text-destructive text-xs" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isUpdating}
          data-testid="edit-quote-submit-button"
        >
          {isUpdating
            ? locale === "vi"
              ? "Đang lưu..."
              : "Saving..."
            : locale === "vi"
              ? "Lưu thay đổi"
              : "Save changes"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isUpdating}
          >
            {quoteLabels.actions.cancel[locale]}
          </Button>
        )}
      </div>
    </form>
  );
}
