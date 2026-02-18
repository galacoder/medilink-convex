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
 * Hospital organization settings page.
 *
 * WHY: Hospital owners/admins need to update their organization's name,
 * slug, and contact info. This page composes the shared OrgSettingsForm
 * with the hospital-specific address field enabled.
 *
 * The onSubmit handler calls the Convex updateOrganization mutation
 * via the fetch API to the Convex HTTP endpoint, keeping the form
 * decoupled from direct Convex imports.
 */
export default function HospitalSettingsPage() {
  const { data: activeOrg, isPending } = useActiveOrganization();
  const labels = settingsLabels.settings;

  async function handleSubmit(values: OrgSettingsValues) {
    if (!activeOrg?.id) {
      throw new Error("Không tìm thấy tổ chức (Organization not found)");
    }

    // Call the Convex HTTP endpoint via fetch
    // WHY: This avoids importing from _generated (gitignored) directly
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
        <h1 className="text-2xl font-semibold">
          {labels.title.vi}{" "}
          <span className="text-muted-foreground text-lg font-normal">
            {/* Organization Settings */}
          </span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {labels.subtitle.vi}
        </p>
      </div>

      {/* Settings form */}
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
            showAddress={true}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
