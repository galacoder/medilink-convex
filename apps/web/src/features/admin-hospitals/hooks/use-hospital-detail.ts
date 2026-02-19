"use client";

/**
 * Hook for loading hospital detail and usage metrics.
 *
 * WHY: Separates detail-view data fetching from list view data.
 * Platform admin detail page needs both org info and usage metrics.
 *
 * vi: "Hook chi tiết bệnh viện — Quản trị viên nền tảng"
 * en: "Hospital detail hook — Platform Admin"
 */
import type { Id } from "convex/_generated/dataModel";
import type { FunctionReference } from "convex/server";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

import type { HospitalDetail, HospitalUsage } from "../types";

// Cast api reference to avoid noUncheckedIndexedAccess issues.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const adminHospitalsApi = (api as any).admin?.hospitals;
type QueryRef = FunctionReference<"query">;
const getHospitalDetailFn: QueryRef = adminHospitalsApi?.getHospitalDetail;
const getHospitalUsageFn: QueryRef = adminHospitalsApi?.getHospitalUsage;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Hook loading hospital detail including members, equipment summary,
 * service request summary for a given hospital ID.
 *
 * vi: "Hook chi tiết bệnh viện" / en: "Hospital detail hook"
 */
export function useHospitalDetail(hospitalId: Id<"organizations"> | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const detail = useQuery(
    getHospitalDetailFn,
    hospitalId ? { hospitalId } : "skip",
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const usage = useQuery(
    getHospitalUsageFn,
    hospitalId ? { hospitalId } : "skip",
  );

  return {
    detail: detail as HospitalDetail | null | undefined,
    usage: usage as HospitalUsage | undefined,
    isLoading: detail === undefined,
    isUsageLoading: usage === undefined,
  };
}
