"use client";

/**
 * Provider profile page.
 *
 * WHY: Providers need to keep their company information current for hospital
 * discovery. This page combines ProviderProfileForm (company details) and
 * CoverageAreaSelector (geographic service area) in a single screen, since
 * both define "who the provider is and where they operate."
 *
 * vi: "Hồ sơ nhà cung cấp" / en: "Provider Profile"
 */
import { useState } from "react";

import { useActiveOrganization } from "~/auth/client";
import { ProviderProfileForm } from "~/features/providers/components/provider-profile-form";
import { CoverageAreaSelector } from "~/features/providers/components/coverage-area-selector";
import type { CoverageAreaEntry } from "~/features/providers/components/coverage-area-selector";
import { useProviderProfile } from "~/features/providers/hooks/use-provider-profile";
import { useProviderMutations } from "~/features/providers/hooks/use-provider-mutations";

export default function ProviderProfilePage() {
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();
  const organizationId = activeOrg?.id ?? "";

  const { profile, isLoading } = useProviderProfile(organizationId);
  const { setCoverageArea } = useProviderMutations();

  const [coverageAreas, setCoverageAreasLocal] = useState<CoverageAreaEntry[]>(
    [],
  );
  const [isSavingCoverage, setIsSavingCoverage] = useState(false);

  async function handleSaveCoverage() {
    if (!organizationId) return;
    setIsSavingCoverage(true);
    try {
      await setCoverageArea({
        organizationId,
        areas: coverageAreas.filter((a) => a.region.trim().length > 0),
      });
    } finally {
      setIsSavingCoverage(false);
    }
  }

  if (orgPending || isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="bg-muted h-48 w-full animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold">
          Hồ sơ nhà cung cấp {/* Provider Profile */}
        </h1>
        <p className="text-muted-foreground mt-1">
          Cập nhật thông tin công ty và khu vực phục vụ{" "}
          {/* Update company info and coverage areas */}
        </p>
      </div>

      {/* Company profile section */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-medium">
          Thông tin công ty {/* Company Information */}
        </h2>
        <ProviderProfileForm
          profile={profile}
          organizationId={organizationId}
          locale="vi"
        />
      </section>

      {/* Coverage areas section */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-medium">
          Khu vực phục vụ {/* Coverage Areas */}
        </h2>
        <CoverageAreaSelector
          value={coverageAreas}
          onChange={setCoverageAreasLocal}
          locale="vi"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            onClick={handleSaveCoverage}
            disabled={isSavingCoverage}
          >
            {isSavingCoverage
              ? "Đang lưu..." /* Saving... */
              : "Lưu khu vực" /* Save Areas */}
          </button>
        </div>
      </section>
    </div>
  );
}
