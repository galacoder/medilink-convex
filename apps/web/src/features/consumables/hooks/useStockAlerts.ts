"use client";

/**
 * Hook for real-time low-stock alerts.
 * Subscribes to getLowStock query for live badge counts in the sidebar.
 *
 * vi: "Hook cảnh báo tồn kho thấp" / en: "Low stock alerts hook"
 */
import { useQuery } from "convex/react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { api as _api } from "../../../../../../convex/_generated/api";

// WHY: Pre-codegen AnyApi type makes property access possibly undefined.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = _api as any;

/**
 * Returns all consumables where currentStock <= reorderPoint.
 * Updates in real-time as Convex data changes.
 *
 * vi: "Vật tư sắp hết hàng" / en: "Low stock consumables"
 */
export function useStockAlerts() {
  const lowStockItems = useQuery(api.consumables.getLowStock, {});

  const isLoading = lowStockItems === undefined;
  const count = lowStockItems?.length ?? 0;
  const hasAlerts = count > 0;
  const outOfStockCount =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lowStockItems?.filter((c: any) => c.currentStock === 0).length ?? 0;

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
