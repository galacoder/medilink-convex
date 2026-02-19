"use client";

/**
 * Visual stock status badge for consumables.
 * Shows in-stock (green), low (amber), or out-of-stock (red) with bilingual labels.
 *
 * vi: "Huy hiệu trạng thái tồn kho" / en: "Stock status badge"
 */

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------

const LABELS = {
  inStock: { vi: "Trong kho", en: "In Stock" },
  low: { vi: "Sắp hết", en: "Low" },
  outOfStock: { vi: "Hết hàng", en: "Out of Stock" },
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StockAlertBadgeProps {
  currentStock: number;
  reorderPoint: number;
  /** Display locale — vi (default) or en */
  locale?: "vi" | "en";
  /** Additional CSS classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Badge showing stock status based on currentStock vs reorderPoint.
 *
 * - out-of-stock: currentStock === 0 → red
 * - low: 0 < currentStock <= reorderPoint → amber
 * - in-stock: currentStock > reorderPoint → green
 *
 * vi: "Huy hiệu trạng thái tồn kho" / en: "Stock status badge"
 */
export function StockAlertBadge({
  currentStock,
  reorderPoint,
  locale = "vi",
  className = "",
}: StockAlertBadgeProps) {
  if (currentStock === 0) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 ${className}`}
        data-testid="stock-badge"
        data-stock-status="out_of_stock"
      >
        {LABELS.outOfStock[locale]}
      </span>
    );
  }

  if (currentStock <= reorderPoint) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 ${className}`}
        data-testid="stock-badge"
        data-stock-status="low"
      >
        {LABELS.low[locale]}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 ${className}`}
      data-testid="stock-badge"
      data-stock-status="in_stock"
    >
      {LABELS.inStock[locale]}
    </span>
  );
}
