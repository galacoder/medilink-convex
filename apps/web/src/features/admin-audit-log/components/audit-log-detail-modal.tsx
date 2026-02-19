"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@medilink/ui/dialog";

import type { AuditLogEntryWithDetails } from "../types";
import { auditLogLabels } from "../labels";

interface AuditLogDetailModalProps {
  entry: AuditLogEntryWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Detail modal for a single audit log entry.
 *
 * Shows the full JSON payload: previousValues and newValues (before/after).
 * This is the compliance view required by Vietnamese medical device regulations.
 *
 * WHY: A modal is the right pattern here — users need to read the payload
 * in context without losing their place in the filtered audit log list.
 *
 * vi: "Hộp thoại chi tiết bản ghi kiểm tra" / en: "Audit log entry detail modal"
 */
export function AuditLogDetailModal({
  entry,
  open,
  onOpenChange,
}: AuditLogDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {auditLogLabels.detail.title.vi}{" "}
            <span className="text-muted-foreground font-normal">
              ({auditLogLabels.detail.title.en})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entry metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">
                {auditLogLabels.fields.timestamp.vi}
              </p>
              <p className="font-medium">
                {new Date(entry.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                {auditLogLabels.fields.actor.vi}
              </p>
              <p className="font-medium">{entry.actorName ?? entry.actorId}</p>
              {entry.actorEmail && (
                <p className="text-muted-foreground text-xs">
                  {entry.actorEmail}
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                {auditLogLabels.fields.action.vi}
              </p>
              <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                {entry.action}
              </code>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                {auditLogLabels.fields.organization.vi}
              </p>
              <p className="font-medium">
                {entry.organizationName ?? entry.organizationId}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                {auditLogLabels.fields.resourceType.vi}
              </p>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                {entry.resourceType}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                {auditLogLabels.fields.resourceId.vi}
              </p>
              <code className="text-muted-foreground font-mono text-xs">
                {entry.resourceId}
              </code>
            </div>
          </div>

          {/* JSON payload: before/after */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Previous values */}
            <div>
              <p className="mb-1.5 text-xs font-medium">
                {auditLogLabels.detail.previousValues.vi}{" "}
                <span className="text-muted-foreground font-normal">
                  ({auditLogLabels.detail.previousValues.en})
                </span>
              </p>
              {entry.previousValues ? (
                <pre className="bg-muted overflow-auto rounded-md p-3 font-mono text-xs">
                  {JSON.stringify(entry.previousValues, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-xs italic">
                  {auditLogLabels.detail.noPayload.vi}
                </p>
              )}
            </div>

            {/* New values */}
            <div>
              <p className="mb-1.5 text-xs font-medium">
                {auditLogLabels.detail.newValues.vi}{" "}
                <span className="text-muted-foreground font-normal">
                  ({auditLogLabels.detail.newValues.en})
                </span>
              </p>
              {entry.newValues ? (
                <pre className="bg-muted overflow-auto rounded-md p-3 font-mono text-xs">
                  {JSON.stringify(entry.newValues, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-xs italic">
                  {auditLogLabels.detail.noPayload.vi}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
