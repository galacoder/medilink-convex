"use client";

/**
 * React hooks for the admin-disputes feature.
 * Wraps Convex queries and mutations for the platform admin dispute arbitration UI.
 *
 * WHY: The generated Convex api stub uses `AnyApi` which requires explicit casts
 * for deeply nested module paths like `api.admin.serviceRequests`. This follows
 * the same pattern used in features/disputes/hooks/use-dispute-detail.ts.
 *
 * vi: "Hooks cho quản trị tranh chấp nền tảng"
 * en: "Platform admin dispute management hooks"
 */
import type { FunctionReference } from "convex/server";
import { useMutation, useQuery } from "convex/react";

import type { Id } from "@medilink/backend";
import { api } from "@medilink/backend";

import type {
  AdminServiceRequest,
  DisputeArbitrationDetail,
  EscalatedDispute,
} from "../types";

// Cast the nested admin api path to avoid AnyApi stub type errors.
// WHY: The generated stub uses AnyApi which doesn't know about sub-paths.
// At runtime, Convex resolves these correctly via anyApi dynamic proxy.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
const adminSrApi = (api as any).admin.serviceRequests;
type QueryRef = FunctionReference<"query">;
type MutationRef = FunctionReference<"mutation">;
const listAllFn: QueryRef = adminSrApi.listAllServiceRequests;
const listEscalatedFn: QueryRef = adminSrApi.listEscalatedDisputes;
const getDetailFn: QueryRef = adminSrApi.getDisputeDetail;
const resolveDisputeFn: MutationRef = adminSrApi.resolveDispute;
const reassignProviderFn: MutationRef = adminSrApi.reassignProvider;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

/**
 * Hook to list all service requests across all organizations.
 * Supports optional filters for status, hospital, provider, and date range.
 *
 * vi: "Danh sách tất cả yêu cầu dịch vụ (toàn nền tảng)"
 * en: "All service requests (platform-wide)"
 */
export function useAdminServiceRequests(
  filters: {
    status?:
      | "pending"
      | "quoted"
      | "accepted"
      | "in_progress"
      | "completed"
      | "cancelled"
      | "disputed";
    hospitalId?: Id<"organizations">;
    providerId?: Id<"providers">;
    fromDate?: number;
    toDate?: number;
  } = {},
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const result = useQuery(listAllFn, filters);
  return result as AdminServiceRequest[] | undefined;
}

/**
 * Hook to list all escalated disputes awaiting platform admin arbitration.
 *
 * vi: "Danh sách tranh chấp leo thang chờ trọng tài"
 * en: "Escalated disputes awaiting arbitration"
 */
export function useEscalatedDisputes(
  filters: {
    fromDate?: number;
    toDate?: number;
  } = {},
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const result = useQuery(listEscalatedFn, filters);
  return result as EscalatedDispute[] | undefined;
}

/**
 * Hook to get full dispute detail for arbitration review.
 * Includes both hospital and provider perspectives, messages, and history.
 *
 * vi: "Chi tiết tranh chấp để trọng tài"
 * en: "Dispute detail for arbitration"
 */
export function useDisputeArbitrationDetail(disputeId: Id<"disputes"> | null) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const result = useQuery(getDetailFn, disputeId ? { disputeId } : "skip");
  return result as DisputeArbitrationDetail | null | undefined;
}

/**
 * Hook to submit an arbitration ruling on an escalated dispute.
 * Resolves the dispute and creates an audit log entry.
 *
 * vi: "Gửi phán quyết trọng tài" / en: "Submit arbitration ruling"
 */
export function useResolveDispute() {
  return useMutation(resolveDisputeFn);
}

/**
 * Hook to re-assign a service request to a different provider.
 * Used after dispute escalation when original provider cannot fulfill.
 *
 * vi: "Phân công lại nhà cung cấp" / en: "Reassign provider"
 */
export function useReassignProvider() {
  return useMutation(reassignProviderFn);
}
