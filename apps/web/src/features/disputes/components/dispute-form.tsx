"use client";

import { useState } from "react";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import { Button } from "@medilink/ui/button";
import { Label } from "@medilink/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";
import { Textarea } from "@medilink/ui/textarea";

import { disputeLabels } from "../labels";
import type { DisputeType } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const disputesApi = api.disputes as any;
const serviceRequestsApi = api.serviceRequests as any;
const createFn: FunctionReference<"mutation"> = disputesApi.create;
const listByHospitalSrFn: FunctionReference<"query"> = serviceRequestsApi.listByHospital;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

interface DisputeFormProps {
  organizationId: Id<"organizations">;
  onSuccess?: (id: Id<"disputes">) => void;
  onCancel?: () => void;
}

const DISPUTE_TYPES: DisputeType[] = ["quality", "pricing", "timeline", "other"];

/**
 * Form for creating a new dispute.
 *
 * WHY: Hospital staff need a guided form to raise disputes against service requests.
 * Bilingual description fields (Vietnamese required, English optional) support
 * international communication with service providers.
 *
 * vi: "Form tạo tranh chấp" / en: "Dispute creation form"
 */
export function DisputeForm({
  organizationId,
  onSuccess,
  onCancel,
}: DisputeFormProps) {
  const [serviceRequestId, setServiceRequestId] = useState<string>("");
  const [type, setType] = useState<DisputeType | "">("");
  const [descriptionVi, setDescriptionVi] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation(createFn);

  // Load service requests for this org (completed or in_progress are valid for disputes)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const serviceRequests = useQuery(listByHospitalSrFn, {
    status: undefined, // get all, filter client-side
  }) as Array<{ _id: string; descriptionVi: string; status: string }> | undefined;

  // Filter to disputeable statuses
  const disputeableRequests = (serviceRequests ?? []).filter(
    (sr) => sr.status === "completed" || sr.status === "in_progress",
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!serviceRequestId || !type || !descriptionVi.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const disputeId = await createMutation({
        organizationId,
        serviceRequestId: serviceRequestId as Id<"serviceRequests">,
        type,
        descriptionVi: descriptionVi.trim(),
        descriptionEn: descriptionEn.trim() || undefined,
      });
      onSuccess?.(disputeId as Id<"disputes">);
    } catch (err) {
      const msg = err instanceof Error ? err.message : disputeLabels.error.vi;
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Service request selector */}
      <div className="space-y-1.5">
        <Label htmlFor="serviceRequestId">
          {disputeLabels.form.serviceRequestLabel.vi}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select value={serviceRequestId} onValueChange={setServiceRequestId}>
          <SelectTrigger id="serviceRequestId">
            <SelectValue placeholder={disputeLabels.placeholders.selectServiceRequest.vi} />
          </SelectTrigger>
          <SelectContent>
            {disputeableRequests.length === 0 ? (
              <SelectItem value="_none" disabled>
                Không có yêu cầu dịch vụ nào phù hợp
              </SelectItem>
            ) : (
              disputeableRequests.map((sr) => (
                <SelectItem key={sr._id} value={sr._id}>
                  <span className="truncate">{sr.descriptionVi}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    ({sr.status})
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Dispute type */}
      <div className="space-y-1.5">
        <Label htmlFor="type">
          {disputeLabels.form.typeLabel.vi}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select value={type} onValueChange={(val) => setType(val as DisputeType)}>
          <SelectTrigger id="type">
            <SelectValue placeholder={disputeLabels.placeholders.selectType.vi} />
          </SelectTrigger>
          <SelectContent>
            {DISPUTE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {disputeLabels.types[t].vi}
                <span className="text-muted-foreground ml-1 text-xs">
                  ({disputeLabels.types[t].en})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description Vietnamese (required) */}
      <div className="space-y-1.5">
        <Label htmlFor="descriptionVi">
          {disputeLabels.fields.descriptionVi.vi}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Textarea
          id="descriptionVi"
          value={descriptionVi}
          onChange={(e) => setDescriptionVi(e.target.value)}
          placeholder={disputeLabels.placeholders.descriptionVi.vi}
          rows={4}
          required
        />
      </div>

      {/* Description English (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="descriptionEn">
          {disputeLabels.fields.descriptionEn.vi}
          <span className="text-muted-foreground ml-1 text-xs">(không bắt buộc)</span>
        </Label>
        <Textarea
          id="descriptionEn"
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          placeholder={disputeLabels.placeholders.descriptionEn.vi}
          rows={3}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {disputeLabels.actions.cancel.vi}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !serviceRequestId || !type || !descriptionVi.trim()}
        >
          {isSubmitting ? disputeLabels.loading.vi : disputeLabels.actions.create.vi}
        </Button>
      </div>
    </form>
  );
}
