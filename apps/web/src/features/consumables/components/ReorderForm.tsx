"use client";

/**
 * Form for creating reorder requests.
 * Submits createReorderRequest mutation with quantity validation.
 *
 * vi: "Biểu mẫu yêu cầu đặt hàng lại" / en: "Reorder request form"
 */
import { useState } from "react";
import { useCreateReorderRequest } from "../hooks/useConsumables";
import type { Id } from "../../../../../../convex/_generated/dataModel";

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------

const LABELS = {
  title: { vi: "Tạo yêu cầu đặt hàng", en: "Create Reorder Request" },
  quantity: { vi: "Số lượng cần đặt", en: "Quantity to Order" },
  notes: { vi: "Ghi chú (tùy chọn)", en: "Notes (optional)" },
  submit: { vi: "Gửi yêu cầu", en: "Submit Request" },
  submitting: { vi: "Đang gửi...", en: "Submitting..." },
  success: { vi: "Yêu cầu đã được gửi thành công", en: "Request submitted successfully" },
  error: { vi: "Có lỗi xảy ra, vui lòng thử lại", en: "An error occurred, please try again" },
  quantityRequired: { vi: "Số lượng phải lớn hơn 0", en: "Quantity must be greater than 0" },
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReorderFormProps {
  consumableId: Id<"consumables">;
  requestedBy: Id<"users">;
  locale?: "vi" | "en";
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Controlled form for creating a reorder request.
 *
 * vi: "Biểu mẫu đặt hàng lại vật tư" / en: "Reorder request form"
 */
export function ReorderForm({
  consumableId,
  requestedBy,
  locale = "vi",
  onSuccess,
}: ReorderFormProps) {
  const [quantity, setQuantity] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createReorderRequest = useCreateReorderRequest();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!quantity || quantity <= 0) {
      setError(LABELS.quantityRequired[locale]);
      return;
    }

    setIsSubmitting(true);
    try {
      await createReorderRequest({
        consumableId,
        quantity: Number(quantity),
        requestedBy,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      setQuantity("");
      setNotes("");
      onSuccess?.();
    } catch {
      setError(LABELS.error[locale]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h3 className="text-base font-semibold">{LABELS.title[locale]}</h3>

      {success && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          {LABELS.success[locale]}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="reorder-quantity"
            className="text-sm font-medium"
          >
            {LABELS.quantity[locale]}
          </label>
          <input
            id="reorder-quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="reorder-notes" className="text-sm font-medium">
            {LABELS.notes[locale]}
          </label>
          <textarea
            id="reorder-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? LABELS.submitting[locale] : LABELS.submit[locale]}
        </button>
      </form>
    </div>
  );
}
