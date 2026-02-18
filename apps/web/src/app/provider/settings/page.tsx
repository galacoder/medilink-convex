"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Skeleton } from "@medilink/ui/skeleton";

import type { OrgSettingsValues } from "~/components/forms/org-settings-form";
import { useActiveOrganization } from "~/auth/client";
import { OrgSettingsForm } from "~/components/forms/org-settings-form";
import { settingsLabels } from "~/lib/i18n/settings-labels";

/**
 * Provider organization settings page.
 *
 * WHY: Provider owners/admins need to update their organization's name,
 * slug, and contact info. This page is the same structure as the hospital
 * settings page but WITHOUT the address field (providers use service type
 * descriptions instead).
 *
 * Future enhancement: add a "Service Type" field specific to providers.
 */
export default function ProviderSettingsPage() {
  const { data: activeOrg, isPending } = useActiveOrganization();
  const labels = settingsLabels.settings;

  async function handleSubmit(values: OrgSettingsValues) {
    if (!activeOrg?.id) {
      throw new Error("Không tìm thấy tổ chức (Organization not found)");
    }

    const response = await fetch(
      "/api/convex/organizations/updateOrganization",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: activeOrg.id,
          ...values,
        }),
      },
    );

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(
        error.message ??
          "Không thể cập nhật cài đặt (Failed to update settings)",
      );
    }
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">{labels.title.vi}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {labels.subtitle.vi}
        </p>
      </div>

      {/* Settings form — no address for providers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{labels.title.vi}</CardTitle>
          <CardDescription>{labels.subtitle.vi}</CardDescription>
        </CardHeader>
        <CardContent>
          <OrgSettingsForm
            defaultValues={{
              name: activeOrg?.name ?? "",
              slug: activeOrg?.slug ?? "",
            }}
            showAddress={false}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
