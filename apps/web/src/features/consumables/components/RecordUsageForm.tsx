"use client";

/**
 * RecordUsageForm — inline form for recording consumable usage.
 *
 * WHY: Staff need a quick way to decrement stock when they use a consumable
 * during patient care or equipment maintenance. The form captures quantity,
 * optional notes, and optionally the related equipment for audit trail purposes.
 *
 * The mutation decrements currentStock and creates a consumableUsageLog entry.
 *
 * vi: "Form ghi nhận sử dụng vật tư" / en: "Record consumable usage form"
 */
import type { GenericId as Id } from "convex/values";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";
import { Textarea } from "@medilink/ui/textarea";

import { useRecordUsage } from "~/features/consumables/hooks/useConsumables";

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------

const LABELS = {
  title: { vi: "Ghi nhận sử dụng", en: "Record Usage" },
  quantity: { vi: "Số lượng sử dụng", en: "Quantity Used" },
  quantityPlaceholder: { vi: "Nhập số lượng", en: "Enter quantity" },
  notes: { vi: "Ghi chú (tuỳ chọn)", en: "Notes (optional)" },
  notesPlaceholder: {
    vi: "Vì sao sử dụng, bệnh nhân nào, v.v.",
    en: "Why used, which patient, etc.",
  },
  submit: { vi: "Xác nhận sử dụng", en: "Confirm Usage" },
  submitting: { vi: "Đang lưu...", en: "Saving..." },
  success: {
    vi: "Đã ghi nhận sử dụng thành công",
    en: "Usage recorded successfully",
  },
  error: {
    vi: "Ghi nhận thất bại. Vui lòng thử lại.",
    en: "Failed to record usage. Please try again.",
  },
  quantityRequired: {
    vi: "Vui lòng nhập số lượng",
    en: "Please enter quantity",
  },
  quantityPositive: {
    vi: "Số lượng phải lớn hơn 0",
    en: "Quantity must be greater than 0",
  },
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RecordUsageFormProps {
  consumableId: Id<"consumables">;
  usedBy: Id<"users">;
  locale?: "vi" | "en";
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Form for recording consumable usage.
 *
 * Calls useRecordUsage() mutation which decrements currentStock
 * and creates an audit log entry in consumableUsageLog.
 *
 * vi: "Ghi nhận sử dụng vật tư" / en: "Record consumable usage"
 */
export function RecordUsageForm({
  consumableId,
  usedBy,
  locale = "vi",
  onSuccess,
}: RecordUsageFormProps) {
  const recordUsage = useRecordUsage();
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty)) {
      setErrorMsg(LABELS.quantityRequired[locale]);
      return;
    }
    if (qty <= 0) {
      setErrorMsg(LABELS.quantityPositive[locale]);
      return;
    }

    setIsSubmitting(true);
    try {
      await recordUsage({
        consumableId,
        quantity: qty,
        usedBy,
        notes: notes.trim() || undefined,
      });
      setSuccessMsg(LABELS.success[locale]);
      setQuantity("");
      setNotes("");
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : LABELS.error[locale];
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-sm font-semibold">{LABELS.title[locale]}</h3>

      <form
        onSubmit={handleSubmit}
        className="space-y-3"
        data-testid="record-usage-form"
      >
        <div>
          <Label htmlFor="usage-quantity" className="text-xs">
            {LABELS.quantity[locale]}
          </Label>
          <Input
            id="usage-quantity"
            type="number"
            min="1"
            step="1"
            placeholder={LABELS.quantityPlaceholder[locale]}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1"
            data-testid="usage-quantity-input"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="usage-notes" className="text-xs">
            {LABELS.notes[locale]}
          </Label>
          <Textarea
            id="usage-notes"
            placeholder={LABELS.notesPlaceholder[locale]}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 resize-none"
            rows={2}
            data-testid="usage-notes-input"
            disabled={isSubmitting}
          />
        </div>

        {successMsg && (
          <p className="text-xs font-medium text-green-600" role="status">
            {successMsg}
          </p>
        )}

        {errorMsg && (
          <p className="text-destructive text-xs font-medium" role="alert">
            {errorMsg}
          </p>
        )}

        <Button
          type="submit"
          size="sm"
          className="w-full"
          disabled={isSubmitting}
          data-testid="usage-submit-button"
        >
          {isSubmitting ? LABELS.submitting[locale] : LABELS.submit[locale]}
        </Button>
      </form>
    </div>
  );
}
