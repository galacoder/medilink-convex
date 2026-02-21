"use client";

/**
 * Edit service offering page.
 *
 * WHY: Providers need to update their service offerings as their capabilities,
 * pricing, or turnaround times change. This page fetches the existing offering
 * data and passes it to the shared OfferingForm in edit mode.
 *
 * Route: /provider/offerings/[id]/edit
 *
 * vi: "Chỉnh sửa dịch vụ" / en: "Edit Offering"
 */
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useActiveOrganization } from "~/auth/client";
import { OfferingForm } from "~/features/providers/components/offering-form";
import { useProviderOfferings } from "~/features/providers/hooks/use-provider-offerings";

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------

const LABELS = {
  title: { vi: "Chỉnh sửa dịch vụ", en: "Edit Offering" },
  back: { vi: "Quay lại danh sách dịch vụ", en: "Back to offerings" },
  notFound: {
    vi: "Không tìm thấy dịch vụ",
    en: "Offering not found",
  },
  loading: { vi: "Đang tải...", en: "Loading..." },
} as const;

// ---------------------------------------------------------------------------
// Props — Next.js 15: params is a Promise
// ---------------------------------------------------------------------------

interface EditOfferingPageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Edit offering page.
 *
 * Fetches the offering by looking through the organization's offerings list
 * and renders OfferingForm in edit mode.
 *
 * WHY fetching from list instead of individual query: The providers Convex module
 * exposes listServiceOfferings but not a single-offering getter. Since the list
 * is already subscribed in the parent list page (real-time), this avoids an
 * additional query while keeping consistency.
 *
 * vi: "Chỉnh sửa dịch vụ" / en: "Edit Offering"
 */
export default function EditOfferingPage({ params }: EditOfferingPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const locale = "vi" as const;

  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();
  const organizationId = activeOrg?.id ?? "";
  const { offerings, isLoading } = useProviderOfferings(organizationId);

  function handleSuccess() {
    router.push("/provider/offerings");
  }

  function handleCancel() {
    router.push("/provider/offerings");
  }

  // Loading state while org or offerings load
  if (orgPending || isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-64 animate-pulse rounded" />
      </div>
    );
  }

  // Find the offering to edit from the list
  const offering = offerings.find((o) => o._id === id);

  if (!offering) {
    return (
      <div className="space-y-4">
        <Link
          href="/provider/offerings"
          className="text-muted-foreground text-sm hover:underline"
        >
          &larr; {LABELS.back[locale]}
        </Link>
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">{LABELS.notFound[locale]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/provider/offerings"
        className="text-muted-foreground text-sm hover:underline"
      >
        &larr; {LABELS.back[locale]}
      </Link>

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold">{LABELS.title[locale]}</h1>
      </div>

      {/* Edit form */}
      <OfferingForm
        mode="edit"
        offering={offering}
        organizationId={organizationId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        locale={locale}
      />
    </div>
  );
}
