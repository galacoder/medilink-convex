/**
 * Consumables feature module barrel exports.
 *
 * vi: "Xuất module vật tư tiêu hao" / en: "Consumables feature exports"
 */

// Hooks
export { useConsumablesList, useConsumable, useConsumableUsageLog, useReorderRequests, useCreateConsumable, useUpdateConsumable, useRecordUsage, useReceiveStock, useAdjustStock, useCreateReorderRequest, useUpdateReorderStatus } from "./hooks/useConsumables";
export type { ConsumableCategoryType, ConsumableStockLevel } from "./hooks/useConsumables";

export { useStockAlerts } from "./hooks/useStockAlerts";

// Components
export { ConsumablesTable } from "./components/ConsumablesTable";
export { StockAlertBadge } from "./components/StockAlertBadge";
export { ReorderForm } from "./components/ReorderForm";
export { UsageLogTable } from "./components/UsageLogTable";
