"use client";

/**
 * Create service request page.
 *
 * WHY: Hospital staff create a new service request by selecting equipment
 * and describing the issue. This page bridges ServiceRequestForm (pure UI)
 * with the Convex create mutation and navigation logic (impure). Separation
 * keeps the form testable without mocking Convex.
 *
 * Route: /hospital/service-requests/new
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";

import { api } from "@medilink/db/api";
import { Button } from "@medilink/ui/button";

import type { CreateServiceRequestInput } from "~/features/service-requests/types";
import { useActiveOrganization } from "~/auth/client";
import { ServiceRequestForm } from "~/features/service-requests/components/service-request-form";
import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";

const labels = serviceRequestLabels;

export default function NewServiceRequestPage() {
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const createRequest = useMutation(api.serviceRequests.create);

  async function handleSubmit(
    formData: Omit<CreateServiceRequestInput, "organizationId">,
  ) {
    if (!activeOrg?.id) {
      throw new Error(labels.errors.createFailed.vi);
    }

    const id = (await createRequest({
      organizationId: activeOrg.id,
      equipmentId: formData.equipmentId,
      type: formData.type,
      priority: formData.priority,
      descriptionVi: formData.descriptionVi,
      descriptionEn: formData.descriptionEn,
      scheduledAt: formData.scheduledAt,
    })) as string;

    router.push(`/hospital/service-requests/${id}`);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/hospital/service-requests">
            ← {labels.buttons.back.vi}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{labels.pages.create.vi}</h1>
          <p className="text-muted-foreground text-sm">
            {labels.pages.create.en}
          </p>
        </div>
      </div>

      {/* Multi-step form */}
      <div className="max-w-2xl">
        <ServiceRequestForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
