"use client";

/**
 * Hook for real-time low-stock alerts.
 * Subscribes to getLowStock query for live badge counts in the sidebar.
 *
 * WHY: Uses anyApi from convex/server (the official typed alternative to `as any`)
 * to call the Convex getLowStock query without triggering no-unsafe-* lint rules.
 *
 * vi: "Hook cảnh báo tồn kho thấp" / en: "Low stock alerts hook"
 */
import { useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { anyApi } from "convex/server";
import type { ConsumableDoc } from "./useConsumables";

// Module-level ref — see useConsumables.ts for WHY pattern
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const getLowStockRef = anyApi.consumables!.getLowStock as FunctionReference<"query">;

/**
 * Returns all consumables where currentStock <= reorderPoint.
 * Updates in real-time as Convex data changes.
 *
 * vi: "Vật tư sắp hết hàng" / en: "Low stock consumables"
 */
export function useStockAlerts() {
  // WHY: AnyFunctionReference return type boundary — result is `any` until
  // convex dev generates full types. Cast immediately to our typed interface.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const raw = useQuery(getLowStockRef, {});
  const lowStockItems = raw as ConsumableDoc[] | undefined;

  const isLoading = lowStockItems === undefined;
  const count = lowStockItems?.length ?? 0;
  const hasAlerts = count > 0;
  const outOfStockCount =
    lowStockItems?.filter((c) => c.currentStock === 0).length ?? 0;

  return {
    /** All consumables below reorder point */
    items: lowStockItems ?? [],
    /** Number of low-stock items */
    count,
    /** True if there are any low-stock items */
    hasAlerts,
    /** Number of completely out-of-stock items */
    outOfStockCount,
    /** True while the query is loading */
    isLoading,
  };
}
