"use client";

import type { FunctionReference } from "convex/server";
import { useState } from "react";
import { useMutation } from "convex/react";

import type { Id } from "@medilink/backend";
import { api } from "@medilink/backend";
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
import { Label } from "@medilink/ui/label";
import { Textarea } from "@medilink/ui/textarea";

import type { DisputeStatus } from "../types";
import { disputeLabels } from "../labels";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const disputesApi = (api as any).disputes;
const escalateFn: FunctionReference<"mutation"> = disputesApi.escalate;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

interface EscalationButtonProps {
  disputeId: Id<"disputes">;
  status: DisputeStatus;
  onSuccess?: () => void;
}

/** Statuses that allow escalation */
const ESCALATABLE_STATUSES: DisputeStatus[] = ["open", "investigating"];

/**
 * Escalation button with AlertDialog confirmation.
 *
 * WHY: Escalation is an irreversible action that transfers dispute to platform admin.
 * The confirmation dialog prevents accidental escalation and allows the user to
 * provide context about why escalation is needed.
 *
 * Disabled and shows tooltip when status is not escalatable.
 *
 * vi: "Nút leo thang tranh chấp" / en: "Dispute escalation button"
 */
export function EscalationButton({
  disputeId,
  status,
  onSuccess,
}: EscalationButtonProps) {
  const [reason, setReason] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const escalateMutation = useMutation(escalateFn);

  const canEscalate = ESCALATABLE_STATUSES.includes(status);

  async function handleEscalate() {
    setIsEscalating(true);
    setError(null);

    try {
      await escalateMutation({
        id: disputeId,
        reason: reason.trim() || undefined,
      });
      setReason("");
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : disputeLabels.error.vi;
      setError(msg);
    } finally {
      setIsEscalating(false);
    }
  }

  if (!canEscalate) {
    return (
      <div title={disputeLabels.escalation.disabledTooltip.vi}>
        <Button variant="outline" size="sm" disabled className="w-full">
          {disputeLabels.actions.escalate.vi}
        </Button>
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full">
          {disputeLabels.actions.escalate.vi}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {disputeLabels.escalation.title.vi}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {disputeLabels.escalation.description.vi}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Reason textarea */}
        <div className="space-y-1.5 py-2">
          <Label htmlFor="escalationReason">
            {disputeLabels.escalation.reasonLabel.vi}
          </Label>
          <Textarea
            id="escalationReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={disputeLabels.placeholders.escalationReason.vi}
            rows={3}
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason("")}>
            {disputeLabels.escalation.cancel.vi}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEscalate}
            disabled={isEscalating}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isEscalating
              ? disputeLabels.loading.vi
              : disputeLabels.escalation.confirm.vi}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
