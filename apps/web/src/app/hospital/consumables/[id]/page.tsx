"use client";

/**
 * Hospital consumable detail page.
 * Shows consumable stock info, usage history, and reorder form.
 *
 * WHY: Staff need a detailed view for each consumable to track
 * stock movements, see linked equipment, and create reorder requests.
 *
 * vi: "Trang chi tiết vật tư tiêu hao" / en: "Consumable Detail Page"
 */
import Link from "next/link";
import { useConsumable } from "~/features/consumables/hooks/useConsumables";
import { StockAlertBadge } from "~/features/consumables/components/StockAlertBadge";
import { UsageLogTable } from "~/features/consumables/components/UsageLogTable";
import { ReorderForm } from "~/features/consumables/components/ReorderForm";
import type { Id } from "../../../../../../../convex/_generated/dataModel";

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------

const LABELS = {
  back: { vi: "Quay lại danh sách", en: "Back to list" },
  notFound: { vi: "Không tìm thấy vật tư", en: "Consumable not found" },
  currentStock: { vi: "Tồn kho hiện tại", en: "Current Stock" },
  parLevel: { vi: "Mức tối thiểu", en: "Par Level" },
  reorderPoint: { vi: "Điểm đặt hàng", en: "Reorder Point" },
  unit: { vi: "Đơn vị tính", en: "Unit" },
  category: { vi: "Loại vật tư", en: "Category" },
  linkedEquipment: { vi: "Thiết bị liên kết", en: "Linked Equipment" },
  sku: { vi: "Mã SKU", en: "SKU" },
  manufacturer: { vi: "Nhà sản xuất", en: "Manufacturer" },
  loading: { vi: "Đang tải...", en: "Loading..." },
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConsumableDetailPageProps {
  params: {
    id: string;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Detail page for a single consumable item.
 *
 * vi: "Chi tiết vật tư tiêu hao" / en: "Consumable detail"
 */
export default function ConsumableDetailPage({
  params,
}: ConsumableDetailPageProps) {
  const locale = "vi" as const;
  const consumableId = params.id as Id<"consumables">;
  const consumable = useConsumable(consumableId);

  if (consumable === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground text-sm">{LABELS.loading[locale]}</div>
      </div>
    );
  }

  if (consumable === null) {
    return (
      <div className="space-y-4">
        <Link
          href="/hospital/consumables"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {LABELS.back[locale]}
        </Link>
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">{LABELS.notFound[locale]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        href="/hospital/consumables"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← {LABELS.back[locale]}
      </Link>

      {/* Page heading with stock badge */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{consumable.nameVi}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{consumable.nameEn}</p>
        </div>
        <StockAlertBadge
          currentStock={consumable.currentStock}
          reorderPoint={consumable.reorderPoint}
          locale={locale}
        />
      </div>

      {/* Stock information card */}
      <div className="rounded-lg border p-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-sm">{LABELS.currentStock[locale]}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {consumable.currentStock}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">{LABELS.parLevel[locale]}</dt>
            <dd className="mt-1 text-lg tabular-nums">{consumable.parLevel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">{LABELS.reorderPoint[locale]}</dt>
            <dd className="mt-1 text-lg tabular-nums">{consumable.reorderPoint}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">{LABELS.unit[locale]}</dt>
            <dd className="mt-1">{consumable.unitOfMeasure}</dd>
          </div>
          {consumable.sku && (
            <div>
              <dt className="text-muted-foreground text-sm">{LABELS.sku[locale]}</dt>
              <dd className="mt-1 font-mono text-sm">{consumable.sku}</dd>
            </div>
          )}
          {consumable.manufacturer && (
            <div>
              <dt className="text-muted-foreground text-sm">{LABELS.manufacturer[locale]}</dt>
              <dd className="mt-1">{consumable.manufacturer}</dd>
            </div>
          )}
        </dl>

        {/* Linked equipment */}
        {consumable.relatedEquipment && (
          <div className="mt-4 border-t pt-4">
            <dt className="text-muted-foreground text-sm">{LABELS.linkedEquipment[locale]}</dt>
            <dd className="mt-1 font-medium">{consumable.relatedEquipment.nameVi}</dd>
            <dd className="text-muted-foreground text-xs">{consumable.relatedEquipment.nameEn}</dd>
          </div>
        )}
      </div>

      {/* Usage log and reorder form side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UsageLogTable consumableId={consumableId} locale={locale} />
        </div>
        <div>
          {/* WHY: requestedBy needs the authenticated user ID - placeholder for auth integration */}
          {/* The ReorderForm will be wired to the actual user ID once auth provides it */}
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            Đăng nhập để tạo yêu cầu đặt hàng {/* Sign in to create reorder request */}
          </div>
        </div>
      </div>
    </div>
  );
}
