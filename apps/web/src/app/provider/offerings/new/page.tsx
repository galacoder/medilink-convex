"use client";

/**
 * New service offering page.
 *
 * WHY: Providers need a dedicated page to create a new offering without
 * leaving the offerings list context. On success, navigates back to the
 * offerings list so providers can see their new offering immediately.
 *
 * vi: "Thêm dịch vụ mới" / en: "Add New Offering"
 */
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useActiveOrganization } from "~/auth/client";
import { OfferingForm } from "~/features/providers/components/offering-form";

export default function NewOfferingPage() {
  const router = useRouter();
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();

  const organizationId = activeOrg?.id ?? "";

  function handleSuccess() {
    router.push("/provider/offerings");
  }

  if (orgPending) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Breadcrumb / back link */}
      <div>
        <Link
          href="/provider/offerings"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Quay lại danh sách dịch vụ {/* Back to offerings list */}
        </Link>
      </div>

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold">
          Thêm dịch vụ mới {/* Add New Offering */}
        </h1>
        <p className="text-muted-foreground mt-1">
          Điền thông tin để thêm dịch vụ cung cấp mới{" "}
          {/* Fill in details to add a new service offering */}
        </p>
      </div>

      <OfferingForm
        mode="create"
        organizationId={organizationId}
        onSuccess={handleSuccess}
        onCancel={() => router.push("/provider/offerings")}
        locale="vi"
      />
    </div>
  );
}
