"use client";

/**
 * Arbitration panel component for platform admin dispute resolution.
 * Allows platform admins to review evidence and submit a ruling.
 *
 * vi: "Bảng điều khiển trọng tài tranh chấp" / en: "Dispute arbitration panel"
 */
import { useState } from "react";
import { GavelIcon, Loader2Icon } from "lucide-react";

import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@medilink/ui/dialog";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";
import { Textarea } from "@medilink/ui/textarea";

import type { ArbitrationResolution, ArbitrationRulingForm } from "../types";
import { adminDisputeLabels } from "../labels";

interface ArbitrationPanelProps {
  onSubmitRuling: (ruling: ArbitrationRulingForm) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Arbitration ruling form for platform admins.
 * Allows selection of resolution type and entering a reason.
 *
 * WHY: Using a controlled form with inline validation before showing the
 * confirmation dialog prevents invalid form submissions and gives immediate
 * feedback to the admin before the irreversible action.
 */
export function ArbitrationPanel({
  onSubmitRuling,
  isSubmitting = false,
}: ArbitrationPanelProps) {
  const [resolution, setResolution] = useState<ArbitrationResolution | "">("");
  const [reasonVi, setReasonVi] = useState("");
  const [reasonEn, setReasonEn] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isPartialRefund = resolution === "partial_refund";
  const isRefund = resolution === "refund" || isPartialRefund;
  const isFormValid =
    resolution !== "" &&
    reasonVi.length >= 10 &&
    (!isPartialRefund || (refundAmount !== "" && parseFloat(refundAmount) > 0));

  function handleSubmitClick() {
    if (!isFormValid) return;
    setShowConfirmDialog(true);
  }

  async function handleConfirmRuling() {
    if (!resolution) return;
    await onSubmitRuling({
      resolution,
      reasonVi,
      reasonEn: reasonEn || undefined,
      refundAmount:
        isRefund && refundAmount ? parseFloat(refundAmount) : undefined,
    });
    setShowConfirmDialog(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GavelIcon className="h-4 w-4" />
            {adminDisputeLabels.arbitration.title.vi}{" "}
            {/* Dispute Arbitration */}
          </CardTitle>
          <CardDescription>
            {adminDisputeLabels.arbitration.ruling.vi} {/* Ruling */}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resolution type */}
          <div className="space-y-2">
            <Label htmlFor="resolution">
              {adminDisputeLabels.arbitration.resolutionType.vi}{" "}
              {/* Resolution Type */}
            </Label>
            <Select
              value={resolution}
              onValueChange={(val) =>
                setResolution(val as ArbitrationResolution)
              }
            >
              <SelectTrigger id="resolution">
                <SelectValue
                  placeholder={adminDisputeLabels.filters.allStatuses.vi}
                />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(adminDisputeLabels.resolutionTypes) as [
                    ArbitrationResolution,
                    { vi: string; en: string },
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label.vi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refund amount — only for refund or partial_refund */}
          {(resolution === "refund" || resolution === "partial_refund") && (
            <div className="space-y-2">
              <Label htmlFor="refundAmount">
                {adminDisputeLabels.arbitration.refundAmount.vi}{" "}
                {/* Refund Amount (VND) */}
              </Label>
              <Input
                id="refundAmount"
                type="number"
                min="0"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="1,000,000"
              />
            </div>
          )}

          {/* Reason (Vietnamese) */}
          <div className="space-y-2">
            <Label htmlFor="reasonVi">
              {adminDisputeLabels.arbitration.reasonVi.vi}{" "}
              {/* Reason (Vietnamese) */}
            </Label>
            <Textarea
              id="reasonVi"
              value={reasonVi}
              onChange={(e) => setReasonVi(e.target.value)}
              placeholder="Nhập lý do phán quyết..."
              rows={3}
              className="resize-none"
            />
            {reasonVi.length > 0 && reasonVi.length < 10 && (
              <p className="text-destructive text-xs">
                Lý do phải có ít nhất 10 ký tự (Reason must be at least 10
                characters)
              </p>
            )}
          </div>

          {/* Reason (English) — optional */}
          <div className="space-y-2">
            <Label htmlFor="reasonEn">
              {adminDisputeLabels.arbitration.reasonEn.vi}{" "}
              {/* Reason (English) */}
            </Label>
            <Textarea
              id="reasonEn"
              value={reasonEn}
              onChange={(e) => setReasonEn(e.target.value)}
              placeholder="Enter ruling reason in English (optional)..."
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmitClick}
            disabled={!isFormValid || isSubmitting}
            className="w-full gap-2"
          >
            {isSubmitting ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <GavelIcon className="h-4 w-4" />
            )}
            {adminDisputeLabels.arbitration.submitRuling.vi}{" "}
            {/* Submit Ruling */}
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adminDisputeLabels.arbitration.confirmTitle.vi}{" "}
              {/* Confirm Arbitration Ruling */}
            </DialogTitle>
            <DialogDescription>
              {adminDisputeLabels.arbitration.confirmDescription.vi}{" "}
              {/* This ruling cannot be undone. */}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {adminDisputeLabels.arbitration.resolutionType.vi}
              </span>
              <span className="font-medium">
                {resolution
                  ? adminDisputeLabels.resolutionTypes[resolution].vi
                  : "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground shrink-0">
                {adminDisputeLabels.arbitration.reasonVi.vi}
              </span>
              <span className="text-right text-sm">{reasonVi}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              {adminDisputeLabels.arbitration.cancel.vi} {/* Cancel */}
            </Button>
            <Button
              onClick={() => void handleConfirmRuling()}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {adminDisputeLabels.arbitration.submitRuling.vi}{" "}
              {/* Submit Ruling */}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
