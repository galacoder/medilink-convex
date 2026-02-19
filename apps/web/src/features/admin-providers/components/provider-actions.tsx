"use client";

import type { Id } from "convex/_generated/dataModel";
import { useState } from "react";

import { Button } from "@medilink/ui/button";
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

import type { AdminProviderDetail } from "../types";
import { useAdminProviderActions } from "../hooks/use-admin-providers";
import { adminProviderLabels } from "../labels";

interface ProviderActionsProps {
  provider: AdminProviderDetail;
  onActionComplete?: () => void;
}

type ActionType = "approve" | "reject" | "suspend" | "reactivate" | null;

/**
 * Action buttons and dialogs for platform admin provider management.
 *
 * WHY: Provider approval/rejection/suspension are consequential administrative
 * actions that require confirmation dialogs. Co-locating all dialog state in
 * one component keeps the detail page clean.
 *
 * vi: "Các hành động quản trị nhà cung cấp" / en: "Admin provider actions"
 */
export function ProviderActions({
  provider,
  onActionComplete,
}: ProviderActionsProps) {
  const labels = adminProviderLabels;
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { approveProvider, rejectProvider, suspendProvider } =
    useAdminProviderActions();

  // WHY: provider._id is typed as string in AdminProviderDetail (plain type),
  // but Convex mutations require the branded Id<"providers"> type.
  const providerId = provider._id as Id<"providers">;

  const handleClose = () => {
    setActiveAction(null);
    setReason("");
    setNotes("");
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await approveProvider({
        providerId,
        notes: notes || undefined,
      });
      onActionComplete?.();
      handleClose();
    } catch (error) {
      console.error("Approve failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await rejectProvider({ providerId, reason });
      onActionComplete?.();
      handleClose();
    } catch (error) {
      console.error("Reject failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspend = async (reactivate = false) => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await suspendProvider({
        providerId,
        reason,
        reactivate: reactivate || undefined,
      });
      onActionComplete?.();
      handleClose();
    } catch (error) {
      console.error("Suspend/reactivate failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which actions are available based on current status
  const canApprove = provider.status === "pending_verification";
  const canReject = provider.status === "pending_verification";
  const canSuspend = provider.status === "active";
  const canReactivate = provider.status === "suspended";

  return (
    <div className="flex flex-wrap gap-2">
      {/* Approve button */}
      {canApprove && (
        <Button
          variant="default"
          size="sm"
          onClick={() => setActiveAction("approve")}
          className="bg-green-600 hover:bg-green-700"
        >
          {labels.actions.approve.vi} {/* Phê duyệt */}
        </Button>
      )}

      {/* Reject button */}
      {canReject && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveAction("reject")}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          {labels.actions.reject.vi} {/* Từ chối */}
        </Button>
      )}

      {/* Suspend button */}
      {canSuspend && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveAction("suspend")}
          className="border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          {labels.actions.suspend.vi} {/* Đình chỉ */}
        </Button>
      )}

      {/* Reactivate button */}
      {canReactivate && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveAction("reactivate")}
          className="border-green-300 text-green-700 hover:bg-green-50"
        >
          {labels.actions.reactivate.vi} {/* Khôi phục */}
        </Button>
      )}

      {/* Approve dialog */}
      <Dialog open={activeAction === "approve"} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.dialogs.approveTitle.vi}</DialogTitle>
            {/* Phê duyệt nhà cung cấp */}
            <DialogDescription>
              {labels.dialogs.approveDescription.vi}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="approve-notes">
                {labels.dialogs.notesLabel.vi}
              </Label>
              {/* Ghi chú (không bắt buộc) */}
              <Input
                id="approve-notes"
                placeholder={labels.placeholders.notes.vi}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {labels.dialogs.cancel.vi} {/* Hủy */}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? labels.loading.vi : labels.dialogs.confirm.vi}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={activeAction === "reject"} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.dialogs.rejectTitle.vi}</DialogTitle>
            {/* Từ chối nhà cung cấp */}
            <DialogDescription>
              {labels.dialogs.rejectDescription.vi}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reject-reason">
              {labels.dialogs.reasonLabel.vi}
            </Label>
            {/* Lý do */}
            <Input
              id="reject-reason"
              placeholder={labels.placeholders.reason.vi}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {labels.dialogs.cancel.vi}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting || !reason.trim()}
              variant="destructive"
            >
              {isSubmitting ? labels.loading.vi : labels.dialogs.confirm.vi}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend dialog */}
      <Dialog open={activeAction === "suspend"} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.dialogs.suspendTitle.vi}</DialogTitle>
            {/* Đình chỉ nhà cung cấp */}
            <DialogDescription>
              {labels.dialogs.suspendDescription.vi}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="suspend-reason">
              {labels.dialogs.reasonLabel.vi}
            </Label>
            <Input
              id="suspend-reason"
              placeholder={labels.placeholders.reason.vi}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {labels.dialogs.cancel.vi}
            </Button>
            <Button
              onClick={() => handleSuspend(false)}
              disabled={isSubmitting || !reason.trim()}
              variant="destructive"
            >
              {isSubmitting ? labels.loading.vi : labels.dialogs.confirm.vi}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate dialog */}
      <Dialog open={activeAction === "reactivate"} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.dialogs.reactivateTitle.vi}</DialogTitle>
            {/* Khôi phục nhà cung cấp */}
            <DialogDescription>
              {labels.dialogs.reactivateDescription.vi}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reactivate-reason">
              {labels.dialogs.reasonLabel.vi}
            </Label>
            <Input
              id="reactivate-reason"
              placeholder={labels.placeholders.reason.vi}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {labels.dialogs.cancel.vi}
            </Button>
            <Button
              onClick={() => handleSuspend(true)}
              disabled={isSubmitting || !reason.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? labels.loading.vi : labels.dialogs.confirm.vi}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
