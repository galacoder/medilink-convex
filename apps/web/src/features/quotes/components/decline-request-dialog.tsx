"use client";

/**
 * DeclineRequestDialog component — AlertDialog for declining a service request.
 *
 * WHY: Declining a request is an important action that should require explicit
 * confirmation and a reason. The reason helps the hospital understand why a
 * provider passed, and creates an audit trail via the declineRequest mutation.
 *
 * Zod validation (min 10 chars) is enforced client-side before submission.
 */
import type { Id } from "@medilink/db/dataModel";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@medilink/ui/alert-dialog";
import { Button } from "@medilink/ui/button";
import { Label } from "@medilink/ui/label";

import { useQuoteMutations } from "../hooks/use-quote-mutations";
import { quoteLabels } from "../labels";

interface DeclineRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequestId: string;
  onDeclined?: () => void;
}

const MIN_REASON_LENGTH = 10;

export function DeclineRequestDialog({
  open,
  onOpenChange,
  serviceRequestId,
  onDeclined,
}: DeclineRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { declineRequest } = useQuoteMutations();

  const isValid = reason.trim().length >= MIN_REASON_LENGTH;

  async function handleDecline() {
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await declineRequest({
        serviceRequestId: serviceRequestId as Id<"serviceRequests">,
        reason: reason.trim(),
      });
      setReason("");
      onOpenChange(false);
      onDeclined?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra. Vui lòng thử lại. (An error occurred. Please try again.)",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setReason("");
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent data-testid="decline-request-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {quoteLabels.confirmDecline.title.vi}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {quoteLabels.confirmDecline.description.vi}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="decline-reason">
            {quoteLabels.form.declineReason.vi}
          </Label>
          <textarea
            id="decline-reason"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={quoteLabels.form.declineReasonPlaceholder.vi}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            data-testid="decline-reason-textarea"
          />
          {!isValid && reason.length > 0 && (
            <p className="text-destructive text-xs">
              Lý do phải có ít nhất {MIN_REASON_LENGTH} ký tự (Reason must be at
              least {MIN_REASON_LENGTH} characters)
            </p>
          )}
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            {quoteLabels.actions.cancel.vi}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDecline}
            disabled={!isValid || isSubmitting}
            data-testid="decline-confirm-btn"
          >
            {isSubmitting
              ? "Đang gửi..."
              : quoteLabels.actions.declineRequest.vi}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
