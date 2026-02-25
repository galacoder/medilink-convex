/**
 * Billing action dialogs: suspend, reactivate.
 *
 * vi: "Hop thoai thao tac thanh toan" / en: "Billing action dialogs"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import { useState } from "react";

import type { Id } from "@medilink/db/dataModel";
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
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";

import { useBillingMutations } from "../hooks/use-billing-mutations";
import { billingLabels } from "../labels";

// ---------------------------------------------------------------------------
// SuspendDialog
// ---------------------------------------------------------------------------

interface SuspendDialogProps {
  organizationId: Id<"organizations">;
  organizationName: string;
  locale?: "vi" | "en";
  onSuccess?: () => void;
}

/**
 * Dialog to suspend an organization's subscription.
 *
 * vi: "Hop thoai tam ngung dang ky"
 * en: "Suspend subscription dialog"
 */
export function SuspendDialog({
  organizationId,
  organizationName,
  locale = "vi",
  onSuccess,
}: SuspendDialogProps) {
  const L = billingLabels;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { suspendSubscription } = useBillingMutations();

  const handleSuspend = async () => {
    setIsPending(true);
    try {
      await suspendSubscription({
        organizationId,
        reason: reason || undefined,
      });
      setOpen(false);
      setReason("");
      onSuccess?.();
    } catch {
      // Error will be displayed by Convex error boundary
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          {L.suspend[locale]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {L.suspend[locale]} - {organizationName}
          </DialogTitle>
          <DialogDescription>{L.confirmSuspend[locale]}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{L.suspendReason[locale]}</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                locale === "vi"
                  ? "Nhap ly do tam ngung..."
                  : "Enter suspension reason..."
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {L.cancel[locale]}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSuspend}
            disabled={isPending}
          >
            {isPending ? L.loading[locale] : L.suspend[locale]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ReactivateDialog
// ---------------------------------------------------------------------------

interface ReactivateDialogProps {
  organizationId: Id<"organizations">;
  organizationName: string;
  locale?: "vi" | "en";
  onSuccess?: () => void;
}

/**
 * Dialog to reactivate a suspended/grace_period organization.
 *
 * vi: "Hop thoai kich hoat lai dang ky"
 * en: "Reactivate subscription dialog"
 */
export function ReactivateDialog({
  organizationId,
  organizationName,
  locale = "vi",
  onSuccess,
}: ReactivateDialogProps) {
  const L = billingLabels;
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { reactivateSubscription } = useBillingMutations();

  const handleReactivate = async () => {
    setIsPending(true);
    try {
      await reactivateSubscription({ organizationId });
      setOpen(false);
      onSuccess?.();
    } catch {
      // Error will be displayed by Convex error boundary
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {L.reactivate[locale]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {L.reactivate[locale]} - {organizationName}
          </DialogTitle>
          <DialogDescription>
            {locale === "vi"
              ? `Ban co chac chan muon kich hoat lai ${organizationName}?`
              : `Are you sure you want to reactivate ${organizationName}?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {L.cancel[locale]}
          </Button>
          <Button onClick={handleReactivate} disabled={isPending}>
            {isPending ? L.loading[locale] : L.reactivate[locale]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
