"use client";

/**
 * Hook for consumables data access.
 * Wraps Convex useQuery for list/getById and useMutation for CRUD operations.
 *
 * WHY: The generated api.d.ts declares `api` as `AnyApi` until `npx convex dev`
 * runs in CI/prod. We import `anyApi` from convex/server — the official typed
 * alternative — to avoid `as any` casts and keep `no-unsafe-*` rules clean.
 * We then cast return values to our manually-defined interfaces so the rest of
 * the codebase is fully typed.
 *
 * vi: "Hook dữ liệu vật tư tiêu hao" / en: "Consumables data hook"
 */
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { anyApi } from "convex/server";
import type { Id } from "../../../../../../convex/_generated/dataModel";

// ---------------------------------------------------------------------------
// Module-level function references (typed once, reused across hooks)
// WHY: anyApi.consumables is Record<string, T> | undefined in strict mode.
// We extract references once with non-null assertion (!) — safe because
// anyApi always has the consumables module at runtime.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const consumablesModule = anyApi.consumables!;

const consumablesRefs = {
  // Queries
  list: consumablesModule.list as FunctionReference<"query">,
  getById: consumablesModule.getById as FunctionReference<"query">,
  getUsageLog: consumablesModule.getUsageLog as FunctionReference<"query">,
  getReorderRequests: consumablesModule.getReorderRequests as FunctionReference<"query">,
  getLowStock: consumablesModule.getLowStock as FunctionReference<"query">,
  // Mutations
  create: consumablesModule.create as FunctionReference<"mutation">,
  update: consumablesModule.update as FunctionReference<"mutation">,
  recordUsage: consumablesModule.recordUsage as FunctionReference<"mutation">,
  receiveStock: consumablesModule.receiveStock as FunctionReference<"mutation">,
  adjustStock: consumablesModule.adjustStock as FunctionReference<"mutation">,
  createReorderRequest: consumablesModule.createReorderRequest as FunctionReference<"mutation">,
  updateReorderStatus: consumablesModule.updateReorderStatus as FunctionReference<"mutation">,
};

// ---------------------------------------------------------------------------
// Domain types matching convex/schema.ts consumables tables
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

export type ConsumableTransactionType =
  | "RECEIVE"
  | "USAGE"
  | "ADJUSTMENT"
  | "WRITE_OFF"
  | "EXPIRED";

export interface ConsumableDoc {
  _id: Id<"consumables">;
  _creationTime: number;
  organizationId: Id<"organizations">;
  nameVi: string;
  nameEn: string;
  descriptionVi?: string;
  descriptionEn?: string;
  sku?: string;
  manufacturer?: string;
  unitOfMeasure: string;
  categoryType: ConsumableCategoryType;
  currentStock: number;
  parLevel: number;
  maxLevel?: number;
  reorderPoint: number;
  unitCost?: number;
  relatedEquipmentId?: Id<"equipment">;
  createdAt: number;
  updatedAt: number;
}

export interface ConsumableWithEquipment extends ConsumableDoc {
  relatedEquipment: {
    _id: Id<"equipment">;
    nameVi: string;
    nameEn: string;
  } | null;
}

export interface ConsumableUsageLogDoc {
  _id: Id<"consumableUsageLog">;
  _creationTime: number;
  consumableId: Id<"consumables">;
  quantity: number;
  transactionType: ConsumableTransactionType;
  usedBy: Id<"users">;
  equipmentId?: Id<"equipment">;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

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
  const result = usePaginatedQuery(
    consumablesRefs.list,
    {
      categoryType: filters.categoryType,
      stockLevel: filters.stockLevel,
      search: filters.search,
    },
    { initialNumItems: numItems },
  );

  return {
    ...result,
    results: result.results as ConsumableDoc[],
  };
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
  // WHY: AnyFunctionReference return type boundary — result is `any` until
  // convex dev generates full types. Cast immediately to our typed interface.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const raw = useQuery(consumablesRefs.getById, id ? { id } : "skip");
  return raw as ConsumableWithEquipment | null | undefined;
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
  const result = usePaginatedQuery(
    consumablesRefs.getUsageLog,
    consumableId ? { consumableId } : "skip",
    { initialNumItems: numItems },
  );

  return {
    ...result,
    results: result.results as ConsumableUsageLogDoc[],
  };
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
  // WHY: AnyFunctionReference return type boundary — cast handled at call sites
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return useQuery(consumablesRefs.getReorderRequests, { status });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/**
 * Mutation hook for creating a consumable.
 * vi: "Tạo vật tư mới" / en: "Create consumable"
 */
export function useCreateConsumable() {
  return useMutation(consumablesRefs.create);
}

/**
 * Mutation hook for updating consumable info.
 * vi: "Cập nhật vật tư" / en: "Update consumable"
 */
export function useUpdateConsumable() {
  return useMutation(consumablesRefs.update);
}

/**
 * Mutation hook for recording consumable usage (decreases stock).
 * vi: "Ghi nhận sử dụng" / en: "Record usage"
 */
export function useRecordUsage() {
  return useMutation(consumablesRefs.recordUsage);
}

/**
 * Mutation hook for receiving stock (increases stock).
 * vi: "Nhận hàng" / en: "Receive stock"
 */
export function useReceiveStock() {
  return useMutation(consumablesRefs.receiveStock);
}

/**
 * Mutation hook for adjusting stock by a delta.
 * vi: "Điều chỉnh tồn kho" / en: "Adjust stock"
 */
export function useAdjustStock() {
  return useMutation(consumablesRefs.adjustStock);
}

/**
 * Mutation hook for creating a reorder request.
 * vi: "Tạo yêu cầu đặt hàng" / en: "Create reorder request"
 */
export function useCreateReorderRequest() {
  return useMutation(consumablesRefs.createReorderRequest);
}

/**
 * Mutation hook for updating reorder request status.
 * vi: "Cập nhật trạng thái đặt hàng" / en: "Update reorder status"
 */
export function useUpdateReorderStatus() {
  return useMutation(consumablesRefs.updateReorderStatus);
}
