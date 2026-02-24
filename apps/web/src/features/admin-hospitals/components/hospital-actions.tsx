"use client";

/**
 * Hospital action buttons: onboard, suspend, and reactivate.
 *
 * WHY: Platform admins need to manage hospital status directly from the UI
 * without database access. These components wrap the Convex mutations with
 * confirmation dialogs and audit-trail-friendly reason input.
 *
 * vi: "Hành động quản lý bệnh viện" / en: "Hospital management actions"
 */
import type { FunctionReference } from "convex/server";
import { useState } from "react";
import { useMutation } from "convex/react";

import type { Id } from "@medilink/backend";
import { api } from "@medilink/backend";
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
import { Textarea } from "@medilink/ui/textarea";

import { adminHospitalLabels } from "../labels";

// Cast api reference to avoid noUncheckedIndexedAccess issues.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const adminHospitalsApi = (api as any).admin?.hospitals;
type MutationRef = FunctionReference<"mutation">;
const suspendHospitalFn: MutationRef = adminHospitalsApi?.suspendHospital;
const reactivateHospitalFn: MutationRef = adminHospitalsApi?.reactivateHospital;
const onboardHospitalFn: MutationRef = adminHospitalsApi?.onboardHospital;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

// ---------------------------------------------------------------------------
// Onboard Hospital Dialog
// ---------------------------------------------------------------------------

interface OnboardHospitalDialogProps {
  onSuccess?: () => void;
  locale?: "vi" | "en";
}

/**
 * Dialog to onboard a new hospital organization.
 * Creates the org on behalf of the customer and records owner invite.
 *
 * vi: "Hộp thoại thêm bệnh viện mới" / en: "Onboard hospital dialog"
 */
export function OnboardHospitalDialog({
  onSuccess,
  locale = "vi",
}: OnboardHospitalDialogProps) {
  const L = adminHospitalLabels;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onboardHospital = useMutation(onboardHospitalFn);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    // Auto-generate slug from name
    setSlug(
      value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim() || !ownerEmail.trim()) return;
    setIsSubmitting(true);
    try {
      await onboardHospital({
        name,
        slug,
        ownerEmail,
        ownerName: ownerName || undefined,
      });
      setOpen(false);
      setName("");
      setSlug("");
      setOwnerEmail("");
      setOwnerName("");
      onSuccess?.();
    } catch {
      // Error handling can be enhanced with toast in the future
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{L.actions.onboard[locale]}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{L.dialogs.onboard.title[locale]}</DialogTitle>
          <DialogDescription>
            {L.dialogs.onboard.description[locale]}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{L.fields.name[locale]}</Label>
            <Input value={name} onChange={handleNameChange} />
          </div>
          <div>
            <Label>{L.fields.slug[locale]}</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div>
            <Label>{L.fields.ownerEmail[locale]}</Label>
            <Input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>{L.fields.ownerName[locale]}</Label>
            <Input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {L.actions.cancel[locale]}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? L.loading[locale] : L.actions.submit[locale]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Suspend Hospital Dialog
// ---------------------------------------------------------------------------

interface SuspendHospitalDialogProps {
  hospitalId: Id<"organizations">;
  hospitalName: string;
  onSuccess?: () => void;
  locale?: "vi" | "en";
}

/**
 * Dialog to suspend a hospital with a mandatory reason for audit trail.
 *
 * vi: "Hộp thoại đình chỉ bệnh viện" / en: "Suspend hospital dialog"
 */
export function SuspendHospitalDialog({
  hospitalId,
  hospitalName,
  onSuccess,
  locale = "vi",
}: SuspendHospitalDialogProps) {
  const L = adminHospitalLabels;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suspendHospital = useMutation(suspendHospitalFn);

  const handleSubmit = async () => {
    if (reason.trim().length < 10) return;
    setIsSubmitting(true);
    try {
      await suspendHospital({ hospitalId, reason });
      setOpen(false);
      setReason("");
      onSuccess?.();
    } catch {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          {L.actions.suspend[locale]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{L.dialogs.suspend.title[locale]}</DialogTitle>
          <DialogDescription>
            {L.dialogs.suspend.description[locale]}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm font-medium">{hospitalName}</p>
          <div>
            <Label>{L.fields.reason[locale]}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {L.actions.cancel[locale]}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || reason.trim().length < 10}
          >
            {isSubmitting ? L.loading[locale] : L.actions.suspend[locale]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Reactivate Hospital Dialog
// ---------------------------------------------------------------------------

interface ReactivateHospitalDialogProps {
  hospitalId: Id<"organizations">;
  hospitalName: string;
  onSuccess?: () => void;
  locale?: "vi" | "en";
}

/**
 * Dialog to reactivate a suspended hospital.
 *
 * vi: "Hộp thoại kích hoạt lại bệnh viện" / en: "Reactivate hospital dialog"
 */
export function ReactivateHospitalDialog({
  hospitalId,
  hospitalName,
  onSuccess,
  locale = "vi",
}: ReactivateHospitalDialogProps) {
  const L = adminHospitalLabels;
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reactivateHospital = useMutation(reactivateHospitalFn);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await reactivateHospital({ hospitalId, notes: notes || undefined });
      setOpen(false);
      setNotes("");
      onSuccess?.();
    } catch {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          {L.actions.reactivate[locale]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{L.dialogs.reactivate.title[locale]}</DialogTitle>
          <DialogDescription>
            {L.dialogs.reactivate.description[locale]}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm font-medium">{hospitalName}</p>
          <div>
            <Label>{L.fields.notes[locale]}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {L.actions.cancel[locale]}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? L.loading[locale] : L.actions.reactivate[locale]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
