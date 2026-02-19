"use client";

/**
 * Table component for displaying consumables list with filters.
 * Supports filtering by category type and stock level.
 *
 * vi: "Bảng danh sách vật tư tiêu hao" / en: "Consumables list table"
 */
import { useState } from "react";

import type {
  ConsumableCategoryType,
  ConsumableStockLevel,
} from "../hooks/useConsumables";
import { useConsumablesList } from "../hooks/useConsumables";
import { StockAlertBadge } from "./StockAlertBadge";

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------

const LABELS = {
  title: { vi: "Vật tư tiêu hao", en: "Consumables" },
  name: { vi: "Tên vật tư", en: "Name" },
  category: { vi: "Loại", en: "Category" },
  currentStock: { vi: "Tồn kho", en: "Current Stock" },
  parLevel: { vi: "Mức tối thiểu", en: "Par Level" },
  status: { vi: "Trạng thái", en: "Status" },
  unit: { vi: "Đơn vị", en: "Unit" },
  filterAll: { vi: "Tất cả loại", en: "All categories" },
  filterAllStock: { vi: "Tất cả tồn kho", en: "All stock levels" },
  inStock: { vi: "Trong kho", en: "In Stock" },
  low: { vi: "Sắp hết", en: "Low" },
  outOfStock: { vi: "Hết hàng", en: "Out of Stock" },
  noData: { vi: "Chưa có vật tư nào", en: "No consumables found" },
  loadMore: { vi: "Tải thêm", en: "Load more" },
  search: { vi: "Tìm kiếm...", en: "Search..." },
} as const;

const CATEGORY_LABELS: Record<
  ConsumableCategoryType,
  { vi: string; en: string }
> = {
  disposables: { vi: "Dùng một lần", en: "Disposables" },
  reagents: { vi: "Hóa chất", en: "Reagents" },
  electrodes: { vi: "Điện cực", en: "Electrodes" },
  filters: { vi: "Bộ lọc", en: "Filters" },
  lubricants: { vi: "Chất bôi trơn", en: "Lubricants" },
  cleaning_agents: { vi: "Chất tẩy rửa", en: "Cleaning agents" },
  other: { vi: "Khác", en: "Other" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConsumablesTableProps {
  locale?: "vi" | "en";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Paginated table with category and stock-level filters and bilingual labels.
 *
 * vi: "Bảng vật tư tiêu hao có bộ lọc" / en: "Consumables table with filters"
 */
export function ConsumablesTable({ locale = "vi" }: ConsumablesTableProps) {
  const [categoryFilter, setCategoryFilter] = useState<
    ConsumableCategoryType | undefined
  >(undefined);
  const [stockFilter, setStockFilter] = useState<
    ConsumableStockLevel | undefined
  >(undefined);
  const [search, setSearch] = useState("");

  const { results, status, loadMore } = useConsumablesList(
    {
      categoryType: categoryFilter,
      stockLevel: stockFilter,
      search: search || undefined,
    },
    20,
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder={LABELS.search[locale]}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          aria-label={LABELS.search[locale]}
        />

        {/* Category filter */}
        <select
          value={categoryFilter ?? ""}
          onChange={(e) =>
            setCategoryFilter(
              e.target.value
                ? (e.target.value as ConsumableCategoryType)
                : undefined,
            )
          }
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          aria-label={LABELS.filterAll[locale]}
        >
          <option value="">{LABELS.filterAll[locale]}</option>
          {(Object.keys(CATEGORY_LABELS) as ConsumableCategoryType[]).map(
            (cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat][locale]}
              </option>
            ),
          )}
        </select>

        {/* Stock level filter */}
        <select
          value={stockFilter ?? ""}
          onChange={(e) =>
            setStockFilter(
              e.target.value
                ? (e.target.value as ConsumableStockLevel)
                : undefined,
            )
          }
          className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          aria-label={LABELS.filterAllStock[locale]}
        >
          <option value="">{LABELS.filterAllStock[locale]}</option>
          <option value="in_stock">{LABELS.inStock[locale]}</option>
          <option value="low">{LABELS.low[locale]}</option>
          <option value="out_of_stock">{LABELS.outOfStock[locale]}</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <table
          className="w-full text-sm"
          data-testid="consumables-list"
          aria-label={LABELS.title[locale]}
        >
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                {LABELS.name[locale]}
              </th>
              <th className="px-4 py-3 text-left font-medium">
                {LABELS.category[locale]}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {LABELS.currentStock[locale]}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {LABELS.parLevel[locale]}
              </th>
              <th className="px-4 py-3 text-left font-medium">
                {LABELS.unit[locale]}
              </th>
              <th className="px-4 py-3 text-left font-medium">
                {LABELS.status[locale]}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {results.length === 0 && status === "Exhausted" ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-muted-foreground px-4 py-8 text-center text-sm"
                  data-testid="consumables-empty"
                >
                  {LABELS.noData[locale]}
                </td>
              </tr>
            ) : (
              results.map((consumable) => (
                <tr
                  key={consumable._id}
                  className="hover:bg-muted/30 transition-colors"
                  data-testid="consumable-row"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{consumable.nameVi}</div>
                    <div className="text-muted-foreground text-xs">
                      {consumable.nameEn}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {CATEGORY_LABELS[consumable.categoryType][locale]}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {consumable.currentStock}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {consumable.parLevel}
                  </td>
                  <td className="px-4 py-3">{consumable.unitOfMeasure}</td>
                  <td className="px-4 py-3">
                    <StockAlertBadge
                      currentStock={consumable.currentStock}
                      reorderPoint={consumable.reorderPoint}
                      locale={locale}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <button
            onClick={() => loadMore(20)}
            className="hover:bg-muted/50 rounded-md border px-4 py-2 text-sm transition-colors"
          >
            {LABELS.loadMore[locale]}
          </button>
        </div>
      )}
    </div>
  );
}
