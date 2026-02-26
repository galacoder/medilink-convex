"use client";

/**
 * Payment action dialogs: confirm, reject, void.
 *
 * vi: "Hanh dong thanh toan" / en: "Payment actions"
 */
import { useState } from "react";

import { Button } from "@medilink/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@medilink/ui/dialog";
import { Textarea } from "@medilink/ui/textarea";

import type { PaymentStatus } from "../types";
import {
  useConfirmPayment,
  useRejectPayment,
  useVoidPayment,
} from "../hooks/use-payment-mutations";
import { adminPaymentLabels } from "../labels";

// ---------------------------------------------------------------------------
// ConfirmPaymentDialog
// ---------------------------------------------------------------------------

interface ConfirmPaymentDialogProps {
  paymentId: string;
  locale?: "vi" | "en";
  disabled?: boolean;
  onSuccess?: () => void;
}

export function ConfirmPaymentDialog({
  paymentId,
  locale = "vi",
  disabled,
  onSuccess,
}: ConfirmPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const confirmPayment = useConfirmPayment();
  const L = adminPaymentLabels;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await confirmPayment({ paymentId });
      setOpen(false);
      onSuccess?.();
    } catch {
      // Error handled by Convex toast / error boundary
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          {L.actions.confirm[locale]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{L.dialogs.confirm.title[locale]}</DialogTitle>
          <DialogDescription>
            {L.dialogs.confirm.description[locale]}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {L.actions.cancel[locale]}
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? L.loading[locale] : L.actions.confirm[locale]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// RejectPaymentDialog
// ---------------------------------------------------------------------------

interface RejectPaymentDialogProps {
  paymentId: string;
  locale?: "vi" | "en";
  disabled?: boolean;
  onSuccess?: () => void;
}

export function RejectPaymentDialog({
  paymentId,
  locale = "vi",
  disabled,
  onSuccess,
}: RejectPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const rejectPayment = useRejectPayment();
  const L = adminPaymentLabels;

  const handleReject = async () => {
    if (!reason.trim()) return;
    try {
      setLoading(true);
      await rejectPayment({
        paymentId,
        rejectionReason: reason.trim(),
      });
      setOpen(false);
      setReason("");
      onSuccess?.();
    } catch {
      // Error handled by Convex toast / error boundary
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={disabled}>
          {L.actions.reject[locale]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{L.dialogs.reject.title[locale]}</DialogTitle>
          <DialogDescription>
            {L.dialogs.reject.description[locale]}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder={L.dialogs.reject.reasonPlaceholder[locale]}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {L.actions.cancel[locale]}
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading || !reason.trim()}
          >
            {loading ? L.loading[locale] : L.actions.reject[locale]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// VoidPaymentDialog
// ---------------------------------------------------------------------------

interface VoidPaymentDialogProps {
  paymentId: string;
  locale?: "vi" | "en";
  disabled?: boolean;
  onSuccess?: () => void;
}

export function VoidPaymentDialog({
  paymentId,
  locale = "vi",
  disabled,
  onSuccess,
}: VoidPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const voidPayment = useVoidPayment();
  const L = adminPaymentLabels;

  const handleVoid = async () => {
    if (!reason.trim()) return;
    try {
      setLoading(true);
      await voidPayment({
        paymentId,
        reason: reason.trim(),
      });
      setOpen(false);
      setReason("");
      onSuccess?.();
    } catch {
      // Error handled by Convex toast / error boundary
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled}>
          {L.actions.void[locale]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{L.dialogs.void.title[locale]}</DialogTitle>
          <DialogDescription>
            {L.dialogs.void.description[locale]}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder={L.dialogs.void.reasonPlaceholder[locale]}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {L.actions.cancel[locale]}
          </Button>
          <Button
            variant="destructive"
            onClick={handleVoid}
            disabled={loading || !reason.trim()}
          >
            {loading ? L.loading[locale] : L.actions.void[locale]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// PaymentActions (combined based on status)
// ---------------------------------------------------------------------------

interface PaymentActionsProps {
  paymentId: string;
  status: PaymentStatus;
  locale?: "vi" | "en";
  onSuccess?: () => void;
}

/**
 * Renders available actions based on payment status:
 *   pending   -> Confirm, Reject
 *   confirmed -> Void
 *   rejected  -> (none)
 *   refunded  -> (none)
 */
export function PaymentActions({
  paymentId,
  status,
  locale = "vi",
  onSuccess,
}: PaymentActionsProps) {
  if (status === "pending") {
    return (
      <div className="flex gap-2">
        <ConfirmPaymentDialog
          paymentId={paymentId}
          locale={locale}
          onSuccess={onSuccess}
        />
        <RejectPaymentDialog
          paymentId={paymentId}
          locale={locale}
          onSuccess={onSuccess}
        />
      </div>
    );
  }

  if (status === "confirmed") {
    return (
      <VoidPaymentDialog
        paymentId={paymentId}
        locale={locale}
        onSuccess={onSuccess}
      />
    );
  }

  return null;
}
