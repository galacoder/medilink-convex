"use client";

/**
 * Provider offerings list page.
 *
 * WHY: The main management screen for provider service offerings. Providers
 * use this page daily to add, edit, or remove the services they offer to
 * hospitals. The data-testid="offering-list" attribute enables E2E targeting.
 *
 * vi: "Quản lý Dịch vụ" / en: "Service Offerings"
 */
import { useRouter } from "next/navigation";

import type { ServiceOffering } from "~/features/providers/types";
import { useActiveOrganization } from "~/auth/client";
import { OfferingList } from "~/features/providers/components/offering-list";
import { useProviderMutations } from "~/features/providers/hooks/use-provider-mutations";
import { useProviderOfferings } from "~/features/providers/hooks/use-provider-offerings";

export default function ProviderOfferingsPage() {
  const router = useRouter();
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();

  const organizationId = activeOrg?.id ?? "";
  const { offerings, isLoading } = useProviderOfferings(organizationId);
  const { removeServiceOffering } = useProviderMutations();

  function handleAdd() {
    router.push("/provider/offerings/new");
  }

  async function handleDelete(offering: ServiceOffering) {
    if (!organizationId) return;
    await removeServiceOffering({
      organizationId,
      offeringId: offering._id,
    });
  }

  if (orgPending) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold">
          Quản lý Dịch vụ {/* Service Offerings */}
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý các dịch vụ bạn cung cấp cho bệnh viện{" "}
          {/* Manage services you offer to hospitals */}
        </p>
      </div>

      <OfferingList
        offerings={offerings}
        isLoading={isLoading}
        onAdd={handleAdd}
        onDelete={handleDelete}
        locale="vi"
      />
    </div>
  );
}
