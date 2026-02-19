"use client";

/**
 * Hook for consumables data access.
 * Wraps Convex useQuery for list/getById and useMutation for CRUD operations.
 *
 * vi: "Hook dữ liệu vật tư tiêu hao" / en: "Consumables data hook"
 */
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { api as _api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

// WHY: convex dev hasn't been run in this environment so _generated/api.d.ts
// uses AnyApi which makes property access possibly undefined. Cast to any to
// allow TypeScript to resolve function references. At runtime anyApi works correctly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = _api as any;

// ---------------------------------------------------------------------------
// Type aliases for common filter args
// ---------------------------------------------------------------------------

export type ConsumableCategoryType =
  | "disposables"
  | "reagents"
  | "electrodes"
  | "filters"
  | "lubricants"
  | "cleaning_agents"
  | "other";

export type ConsumableStockLevel = "in_stock" | "low" | "out_of_stock";

// ---------------------------------------------------------------------------
// Paginated list hook
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of consumables with optional filters.
 *
 * vi: "Danh sách vật tư có phân trang" / en: "Paginated consumables list"
 */
export function useConsumablesList(
  filters: {
    categoryType?: ConsumableCategoryType;
    stockLevel?: ConsumableStockLevel;
    search?: string;
  } = {},
  numItems = 20,
) {
  return usePaginatedQuery(
    api.consumables.list,
    {
      categoryType: filters.categoryType,
      stockLevel: filters.stockLevel,
      search: filters.search,
    },
    { initialNumItems: numItems },
  );
}

// ---------------------------------------------------------------------------
// Single consumable hook
// ---------------------------------------------------------------------------

/**
 * Returns a single consumable by ID with linked equipment.
 *
 * vi: "Lấy vật tư theo ID" / en: "Get consumable by ID"
 */
export function useConsumable(id: Id<"consumables"> | null) {
  return useQuery(api.consumables.getById, id ? { id } : "skip");
}

// ---------------------------------------------------------------------------
// Usage log hook
// ---------------------------------------------------------------------------

/**
 * Returns paginated usage log for a consumable.
 *
 * vi: "Nhật ký sử dụng vật tư" / en: "Consumable usage log"
 */
export function useConsumableUsageLog(
  consumableId: Id<"consumables"> | null,
  numItems = 20,
) {
  return usePaginatedQuery(
    api.consumables.getUsageLog,
    consumableId ? { consumableId } : "skip",
    { initialNumItems: numItems },
  );
}

// ---------------------------------------------------------------------------
// Reorder requests hook
// ---------------------------------------------------------------------------

/**
 * Returns reorder requests for the org, optionally filtered by status.
 *
 * vi: "Yêu cầu đặt hàng lại" / en: "Reorder requests"
 */
export function useReorderRequests(
  status?:
    | "pending"
    | "approved"
    | "ordered"
    | "received"
    | "cancelled",
) {
  return useQuery(api.consumables.getReorderRequests, { status });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/**
 * Mutation hook for creating a consumable.
 * vi: "Tạo vật tư mới" / en: "Create consumable"
 */
export function useCreateConsumable() {
  return useMutation(api.consumables.create);
}

/**
 * Mutation hook for updating consumable info.
 * vi: "Cập nhật vật tư" / en: "Update consumable"
 */
export function useUpdateConsumable() {
  return useMutation(api.consumables.update);
}

/**
 * Mutation hook for recording consumable usage (decreases stock).
 * vi: "Ghi nhận sử dụng" / en: "Record usage"
 */
export function useRecordUsage() {
  return useMutation(api.consumables.recordUsage);
}

/**
 * Mutation hook for receiving stock (increases stock).
 * vi: "Nhận hàng" / en: "Receive stock"
 */
export function useReceiveStock() {
  return useMutation(api.consumables.receiveStock);
}

/**
 * Mutation hook for adjusting stock by a delta.
 * vi: "Điều chỉnh tồn kho" / en: "Adjust stock"
 */
export function useAdjustStock() {
  return useMutation(api.consumables.adjustStock);
}

/**
 * Mutation hook for creating a reorder request.
 * vi: "Tạo yêu cầu đặt hàng" / en: "Create reorder request"
 */
export function useCreateReorderRequest() {
  return useMutation(api.consumables.createReorderRequest);
}

/**
 * Mutation hook for updating reorder request status.
 * vi: "Cập nhật trạng thái đặt hàng" / en: "Update reorder status"
 */
export function useUpdateReorderStatus() {
  return useMutation(api.consumables.updateReorderStatus);
}
