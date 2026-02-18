/**
 * Provider discovery helper functions for hospital-side search.
 *
 * WHY: Hospital staff need to find verified providers by specialty or geographic
 * coverage. These helpers encapsulate multi-table join logic for reuse by
 * provider discovery queries and future service request workflows.
 *
 * vi: "Tiện ích tìm kiếm nhà cung cấp" / en: "Provider search helpers"
 */

import type { GenericQueryCtx } from "convex/server";
import type { DataModel, Doc } from "../_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;

/**
 * Specialty type (mirrors schema enum).
 * vi: "Chuyên môn dịch vụ" / en: "Service specialty"
 */
export type ServiceSpecialty =
  | "general_repair"
  | "calibration"
  | "installation"
  | "preventive_maint"
  | "electrical"
  | "software"
  | "diagnostics"
  | "training"
  | "other";

/**
 * Result type for specialty-based discovery.
 * vi: "Kết quả tìm kiếm theo chuyên môn" / en: "Specialty search result"
 */
export interface ProviderWithOfferings {
  provider: Doc<"providers">;
  offerings: Doc<"serviceOfferings">[];
}

/**
 * Result type for region-based discovery.
 * vi: "Kết quả tìm kiếm theo khu vực" / en: "Region search result"
 */
export interface ProviderWithCoverage {
  provider: Doc<"providers">;
  coverageAreas: Doc<"coverageAreas">[];
}

/**
 * Find verified providers offering a specific service specialty.
 *
 * WHY: Full-table scan on serviceOfferings then filter by verified status is
 * necessary because there is no compound index on (specialty, verificationStatus).
 * For the current data size this is acceptable; a compound index can be added
 * when performance becomes a concern.
 *
 * Algorithm:
 *   1. Scan all serviceOfferings to collect unique providerIds for the specialty
 *   2. Fetch each provider document
 *   3. Filter for verificationStatus === "verified"
 *   4. Return provider + all their offerings for that specialty
 *
 * vi: "Tìm nhà cung cấp theo chuyên môn" / en: "Find providers by specialty"
 *
 * @param ctx - Convex query context
 * @param specialty - The service specialty to search for
 * @returns Array of { provider, offerings } for verified providers
 */
export async function findProvidersBySpecialty(
  ctx: QueryCtx,
  specialty: ServiceSpecialty,
): Promise<ProviderWithOfferings[]> {
  // Step 1: Collect all serviceOfferings with the matching specialty
  const allOfferings = await ctx.db.query("serviceOfferings").collect();
  const matchingOfferings = allOfferings.filter(
    (o) => o.specialty === specialty,
  );

  // Step 2: Get unique providerIds from matching offerings
  const providerIdSet = new Set(matchingOfferings.map((o) => o.providerId));

  // Step 3: Fetch providers and filter for verified status
  const results: ProviderWithOfferings[] = [];

  for (const providerId of providerIdSet) {
    const provider = await ctx.db.get(providerId);

    if (!provider || provider.verificationStatus !== "verified") {
      continue;
    }

    // Get all offerings for this provider with this specialty
    const providerOfferings = matchingOfferings.filter(
      (o) => o.providerId === providerId,
    );

    results.push({ provider, offerings: providerOfferings });
  }

  return results;
}

/**
 * Find verified providers serving a specific region (and optionally district).
 *
 * WHY: Geographic matching lets hospitals find providers who can physically
 * service their equipment location. The district filter narrows results when
 * a region (e.g., "Hồ Chí Minh") has many providers.
 *
 * Algorithm:
 *   1. Scan all coverageAreas for active areas in the given region
 *   2. Apply optional district filter
 *   3. Fetch each provider and filter for verificationStatus === "verified"
 *   4. Return provider + all their active coverage areas for the region
 *
 * vi: "Tìm nhà cung cấp theo khu vực" / en: "Find providers by region"
 *
 * @param ctx - Convex query context
 * @param region - Province/city to search within (e.g., "Hồ Chí Minh")
 * @param district - Optional district to narrow results (e.g., "Quận 1")
 * @returns Array of { provider, coverageAreas } for verified providers
 */
export async function findProvidersByRegion(
  ctx: QueryCtx,
  region: string,
  district?: string,
): Promise<ProviderWithCoverage[]> {
  // Step 1: Get all active coverage areas matching the region
  const allAreas = await ctx.db.query("coverageAreas").collect();
  let matchingAreas = allAreas.filter(
    (a) => a.isActive && a.region === region,
  );

  // Step 2: Apply optional district filter
  if (district !== undefined) {
    matchingAreas = matchingAreas.filter((a) => a.district === district);
  }

  // Step 3: Get unique providerIds
  const providerIdSet = new Set(matchingAreas.map((a) => a.providerId));

  // Step 4: Fetch providers and filter for verified status
  const results: ProviderWithCoverage[] = [];

  for (const providerId of providerIdSet) {
    const provider = await ctx.db.get(providerId);

    if (!provider || provider.verificationStatus !== "verified") {
      continue;
    }

    // Get all active areas for this provider in this region
    const providerAreas = matchingAreas.filter(
      (a) => a.providerId === providerId,
    );

    results.push({ provider, coverageAreas: providerAreas });
  }

  return results;
}
