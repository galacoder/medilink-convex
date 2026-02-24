"use client";

import type { FunctionReference } from "convex/server";
import { useState } from "react";
import { useMutation } from "convex/react";

import { api } from "@medilink/backend";
import { Button } from "@medilink/ui/button";
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

import type { SupportTicketCategory, SupportTicketPriority } from "../types";
import { supportLabels } from "../labels";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const supportApi = (api as any).support;
const createFn: FunctionReference<"mutation"> = supportApi.create;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

interface TicketFormProps {
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
}

const CATEGORIES: SupportTicketCategory[] = [
  "general",
  "technical",
  "billing",
  "feature_request",
  "other",
];

const PRIORITIES: SupportTicketPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

/**
 * Form for creating a new support ticket.
 *
 * WHY: Users need a guided form to create support tickets with subject,
 * description, category, and priority. Bilingual description fields
 * (Vietnamese required, English optional) support localization.
 *
 * vi: "Form tao phieu ho tro" / en: "Support ticket creation form"
 */
export function TicketForm({ onSuccess, onCancel }: TicketFormProps) {
  const [subjectVi, setSubjectVi] = useState("");
  const [subjectEn, setSubjectEn] = useState("");
  const [descriptionVi, setDescriptionVi] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [category, setCategory] = useState<SupportTicketCategory | "">("");
  const [priority, setPriority] = useState<SupportTicketPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation(createFn);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!subjectVi.trim() || !descriptionVi.trim() || !category) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const ticketId = await createMutation({
        subjectVi: subjectVi.trim(),
        subjectEn: subjectEn.trim() || undefined,
        descriptionVi: descriptionVi.trim(),
        descriptionEn: descriptionEn.trim() || undefined,
        category,
        priority,
      });
      onSuccess?.(ticketId as string);
    } catch (err) {
      const msg = err instanceof Error ? err.message : supportLabels.error.vi;
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isValid =
    subjectVi.trim().length >= 3 &&
    descriptionVi.trim().length >= 10 &&
    category !== "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Subject Vietnamese (required) */}
      <div className="space-y-1.5">
        <Label htmlFor="subjectVi">
          {supportLabels.fields.subjectVi.vi}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="subjectVi"
          value={subjectVi}
          onChange={(e) => setSubjectVi(e.target.value)}
          placeholder={supportLabels.placeholders.subjectVi.vi}
          required
          minLength={3}
        />
      </div>

      {/* Subject English (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="subjectEn">
          {supportLabels.fields.subjectEn.vi}
          <span className="text-muted-foreground ml-1 text-xs">
            (khong bat buoc)
          </span>
        </Label>
        <Input
          id="subjectEn"
          value={subjectEn}
          onChange={(e) => setSubjectEn(e.target.value)}
          placeholder={supportLabels.placeholders.subjectEn.vi}
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label htmlFor="category">
          {supportLabels.form.categoryLabel.vi}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select
          value={category}
          onValueChange={(val) => setCategory(val as SupportTicketCategory)}
        >
          <SelectTrigger id="category">
            <SelectValue
              placeholder={supportLabels.placeholders.selectCategory.vi}
            />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {supportLabels.categories[c].vi}
                <span className="text-muted-foreground ml-1 text-xs">
                  ({supportLabels.categories[c].en})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <Label htmlFor="priority">{supportLabels.form.priorityLabel.vi}</Label>
        <Select
          value={priority}
          onValueChange={(val) => setPriority(val as SupportTicketPriority)}
        >
          <SelectTrigger id="priority">
            <SelectValue
              placeholder={supportLabels.placeholders.selectPriority.vi}
            />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {supportLabels.priorities[p].vi}
                <span className="text-muted-foreground ml-1 text-xs">
                  ({supportLabels.priorities[p].en})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description Vietnamese (required) */}
      <div className="space-y-1.5">
        <Label htmlFor="descriptionVi">
          {supportLabels.fields.descriptionVi.vi}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Textarea
          id="descriptionVi"
          value={descriptionVi}
          onChange={(e) => setDescriptionVi(e.target.value)}
          placeholder={supportLabels.placeholders.descriptionVi.vi}
          rows={4}
          required
          minLength={10}
        />
      </div>

      {/* Description English (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="descriptionEn">
          {supportLabels.fields.descriptionEn.vi}
          <span className="text-muted-foreground ml-1 text-xs">
            (khong bat buoc)
          </span>
        </Label>
        <Textarea
          id="descriptionEn"
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          placeholder={supportLabels.placeholders.descriptionEn.vi}
          rows={3}
        />
      </div>

      {/* Error */}
      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {supportLabels.actions.cancel.vi}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting
            ? supportLabels.loading.vi
            : supportLabels.actions.create.vi}
        </Button>
      </div>
    </form>
  );
}
