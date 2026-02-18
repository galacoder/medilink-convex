"use client";

import { useState } from "react";

import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";

import { settingsLabels } from "~/lib/i18n/settings-labels";

export interface OrgSettingsValues {
  name?: string;
  slug?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

interface OrgSettingsFormProps {
  defaultValues?: OrgSettingsValues;
  /** When true, shows the address field (hospital portals) */
  showAddress?: boolean;
  /**
   * Called on valid submit. Page component handles the actual Convex mutation.
   * Returns a promise — rejects with Error to show an error message.
   */
  onSubmit: (values: OrgSettingsValues) => Promise<void>;
}

/**
 * Shared organization settings form for hospital and provider portals.
 *
 * WHY: Both portals need the same org settings fields (name, slug, contact info).
 * The component is data-agnostic: the page provides the onSubmit handler
 * that calls the Convex mutation. This keeps the form reusable and testable.
 *
 * The showAddress prop toggles the hospital-specific address field.
 */
export function OrgSettingsForm({
  defaultValues,
  showAddress = false,
  onSubmit,
}: OrgSettingsFormProps) {
  const labels = settingsLabels.settings;

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [contactEmail, setContactEmail] = useState(
    defaultValues?.contactEmail ?? "",
  );
  const [contactPhone, setContactPhone] = useState(
    defaultValues?.contactPhone ?? "",
  );
  const [address, setAddress] = useState(defaultValues?.address ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setValidationErrors({});

    // Client-side validation with bilingual messages
    const errors: Record<string, string> = {};
    if (name && name.length < 2) {
      errors.name =
        "Tên tổ chức phải có ít nhất 2 ký tự (Name must be at least 2 characters)";
    }
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      errors.slug =
        "Slug chỉ được chứa chữ thường, số và dấu gạch ngang (Slug may only contain lowercase letters, numbers, and hyphens)";
    }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errors.contactEmail =
        "Email liên hệ không hợp lệ (Invalid contact email)";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name || undefined,
        slug: slug || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        address: address || undefined,
      });

      setFeedback({ type: "success", message: labels.success.vi });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : labels.error.vi,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Organization Name */}
      <div className="space-y-1.5">
        <Label htmlFor="org-name">
          {labels.form.name.vi}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            ({labels.form.name.en})
          </span>
        </Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={labels.form.namePlaceholder.vi}
        />
        {validationErrors.name && (
          <p className="text-destructive text-xs">{validationErrors.name}</p>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <Label htmlFor="org-slug">
          {labels.form.slug.vi}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            ({labels.form.slug.en})
          </span>
        </Label>
        <Input
          id="org-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder={labels.form.slugPlaceholder.vi}
        />
        <p className="text-muted-foreground text-xs">
          {labels.form.slugHint.vi}
        </p>
        {validationErrors.slug && (
          <p className="text-destructive text-xs">{validationErrors.slug}</p>
        )}
      </div>

      {/* Contact Email */}
      <div className="space-y-1.5">
        <Label htmlFor="contact-email">
          {labels.form.contactEmail.vi}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            ({labels.form.contactEmail.en})
          </span>
        </Label>
        <Input
          id="contact-email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder={labels.form.contactEmailPlaceholder.vi}
        />
        {validationErrors.contactEmail && (
          <p className="text-destructive text-xs">
            {validationErrors.contactEmail}
          </p>
        )}
      </div>

      {/* Contact Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="contact-phone">
          {labels.form.contactPhone.vi}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            ({labels.form.contactPhone.en})
          </span>
        </Label>
        <Input
          id="contact-phone"
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder={labels.form.contactPhonePlaceholder.vi}
        />
      </div>

      {/* Address — hospital portal only */}
      {showAddress && (
        <div className="space-y-1.5">
          <Label htmlFor="org-address">
            {labels.form.address.vi}{" "}
            <span className="text-muted-foreground text-xs font-normal">
              ({labels.form.address.en})
            </span>
          </Label>
          <Input
            id="org-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={labels.form.addressPlaceholder.vi}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? labels.form.submitting.vi : labels.form.submit.vi}
      </Button>
    </form>
  );
}
