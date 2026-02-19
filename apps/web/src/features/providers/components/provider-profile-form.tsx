"use client";

/**
 * Form component for editing provider profile information.
 *
 * WHY: Provider admins need to keep their company profile current so hospitals
 * see accurate contact details and descriptions. This form displays all editable
 * profile fields and submits via the updateProfile Convex mutation.
 */
import { useState } from "react";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";

import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";

import type { ProviderProfile } from "../types";
import { providerLabels } from "../labels";

// Convex codegen does not include providers namespace locally -- cast is safe,
// all argument shapes are validated by the Convex schema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
const providersApi = api.providers as any;

interface ProviderProfileFormProps {
  profile: ProviderProfile | null;
  organizationId: string;
  onSuccess?: () => void;
  locale?: "vi" | "en";
}

interface ProfileFormState {
  companyName: string;
  descriptionVi: string;
  descriptionEn: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

const DEFAULT_FORM: ProfileFormState = {
  companyName: "",
  descriptionVi: "",
  descriptionEn: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
};

function profileToFormState(profile: ProviderProfile): ProfileFormState {
  return {
    companyName: profile.companyName ?? "",
    descriptionVi: profile.descriptionVi ?? "",
    descriptionEn: profile.descriptionEn ?? "",
    contactEmail: profile.contactEmail ?? "",
    contactPhone: profile.contactPhone ?? "",
    address: profile.address ?? "",
  };
}

/**
 * ProviderProfileForm renders all editable profile fields and calls
 * the updateProfile mutation on submit.
 */
export function ProviderProfileForm({
  profile,
  organizationId,
  onSuccess,
  locale = "vi",
}: ProviderProfileFormProps) {
  const [form, setForm] = useState<ProfileFormState>(
    profile ? profileToFormState(profile) : DEFAULT_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const updateProfile = useMutation(providersApi.updateProfile);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await updateProfile({
        organizationId,
        companyName: form.companyName || undefined,
        descriptionVi: form.descriptionVi || undefined,
        descriptionEn: form.descriptionEn || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        address: form.address || undefined,
      });

      onSuccess?.();
    } catch {
      setError(
        locale === "vi"
          ? providerLabels.errors.generic.vi
          : providerLabels.errors.generic.en,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid="provider-profile-form"
    >
      {/* Company Name */}
      <div className="space-y-1.5">
        <Label htmlFor="companyName">
          {providerLabels.profile.companyName[locale]}
        </Label>
        <Input
          id="companyName"
          value={form.companyName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, companyName: e.target.value }))
          }
          placeholder={providerLabels.profile.companyNamePlaceholder[locale]}
        />
      </div>

      {/* Description Vietnamese */}
      <div className="space-y-1.5">
        <Label htmlFor="profileDescVi">
          {providerLabels.profile.descriptionVi[locale]}
        </Label>
        <textarea
          id="profileDescVi"
          className="border-input bg-background placeholder:text-muted-foreground flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          value={form.descriptionVi}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, descriptionVi: e.target.value }))
          }
          rows={3}
        />
      </div>

      {/* Description English */}
      <div className="space-y-1.5">
        <Label htmlFor="profileDescEn">
          {providerLabels.profile.descriptionEn[locale]}
        </Label>
        <textarea
          id="profileDescEn"
          className="border-input bg-background placeholder:text-muted-foreground flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          value={form.descriptionEn}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, descriptionEn: e.target.value }))
          }
          rows={3}
        />
      </div>

      {/* Contact Email */}
      <div className="space-y-1.5">
        <Label htmlFor="contactEmail">
          {providerLabels.profile.contactEmail[locale]}
        </Label>
        <Input
          id="contactEmail"
          type="email"
          value={form.contactEmail}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, contactEmail: e.target.value }))
          }
          placeholder={providerLabels.profile.emailPlaceholder[locale]}
        />
      </div>

      {/* Contact Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="contactPhone">
          {providerLabels.profile.contactPhone[locale]}
        </Label>
        <Input
          id="contactPhone"
          type="tel"
          value={form.contactPhone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, contactPhone: e.target.value }))
          }
          placeholder={providerLabels.profile.phonePlaceholder[locale]}
        />
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="address">
          {providerLabels.profile.address[locale]}
        </Label>
        <Input
          id="address"
          value={form.address}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, address: e.target.value }))
          }
          placeholder={providerLabels.profile.addressPlaceholder[locale]}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? providerLabels.actions.saving[locale]
            : providerLabels.actions.save[locale]}
        </Button>
      </div>
    </form>
  );
}
