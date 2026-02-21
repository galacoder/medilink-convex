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
import type { FunctionReference } from "convex/server";
// WHY: convex/_generated/dataModel is gitignored (generated at runtime by `npx convex dev`).
// GenericId<T> from convex/values is the stable npm-package equivalent of the generated Id<T>.
import type { GenericId as Id } from "convex/values";
import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";

import { RecordUsageForm } from "~/features/consumables/components/RecordUsageForm";
import { ReorderForm } from "~/features/consumables/components/ReorderForm";
import { StockAlertBadge } from "~/features/consumables/components/StockAlertBadge";
import { UsageLogTable } from "~/features/consumables/components/UsageLogTable";
import { useConsumable } from "~/features/consumables/hooks/useConsumables";

// WHY: anyApi.auth.getCurrentUser returns the Convex user document whose _id
// is the correct Convex Id<"users"> for Convex mutations. The Better Auth
// client-side session.user.id is the Better Auth internal string ID which
// does NOT equal the Convex document _id.
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const getCurrentUserRef = anyApi.auth!
  .getCurrentUser as FunctionReference<"query">;

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
  signInToReorder: {
    vi: "Đăng nhập để tạo yêu cầu đặt hàng",
    en: "Sign in to create reorder request",
  },
  signInToRecordUsage: {
    vi: "Đăng nhập để ghi nhận sử dụng",
    en: "Sign in to record usage",
  },
} as const;

// ---------------------------------------------------------------------------
// Props — Next.js 15: params is a Promise
// ---------------------------------------------------------------------------

interface ConsumableDetailPageProps {
  params: Promise<{
    id: string;
  }>;
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
  // FIX 6: Next.js 15 async params — use React.use() to unwrap the Promise
  const { id } = use(params);
  const locale = "vi" as const;
  const consumableId = id as Id<"consumables">;
  const consumable = useConsumable(consumableId);

  // FIX 1: Get the Convex user document so we have the correct Convex Id<"users">
  // WHY: session.user.id from Better Auth's client SDK is the Better Auth internal
  // string ID. The reorderRequests.requestedBy field uses v.id("users") which
  // requires a valid Convex document ID. getCurrentUser uses authComponent.getAuthUser
  // which returns the Convex user document with the correct _id.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const convexUser = useQuery(getCurrentUserRef, {});
  const currentUserId = (convexUser as { _id?: Id<"users"> } | null | undefined)
    ?._id;

  if (consumable === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground text-sm">
          {LABELS.loading[locale]}
        </div>
      </div>
    );
  }

  if (consumable === null) {
    return (
      <div className="space-y-4">
        <Link
          href="/hospital/consumables"
          className="text-muted-foreground text-sm hover:underline"
        >
          &larr; {LABELS.back[locale]}
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
        className="text-muted-foreground text-sm hover:underline"
      >
        &larr; {LABELS.back[locale]}
      </Link>

      {/* Page heading with stock badge */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{consumable.nameVi}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {consumable.nameEn}
          </p>
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
            <dt className="text-muted-foreground text-sm">
              {LABELS.currentStock[locale]}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {consumable.currentStock}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">
              {LABELS.parLevel[locale]}
            </dt>
            <dd className="mt-1 text-lg tabular-nums">{consumable.parLevel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">
              {LABELS.reorderPoint[locale]}
            </dt>
            <dd className="mt-1 text-lg tabular-nums">
              {consumable.reorderPoint}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">
              {LABELS.unit[locale]}
            </dt>
            <dd className="mt-1">{consumable.unitOfMeasure}</dd>
          </div>
          {consumable.sku && (
            <div>
              <dt className="text-muted-foreground text-sm">
                {LABELS.sku[locale]}
              </dt>
              <dd className="mt-1 font-mono text-sm">{consumable.sku}</dd>
            </div>
          )}
          {consumable.manufacturer && (
            <div>
              <dt className="text-muted-foreground text-sm">
                {LABELS.manufacturer[locale]}
              </dt>
              <dd className="mt-1">{consumable.manufacturer}</dd>
            </div>
          )}
        </dl>

        {/* Linked equipment */}
        {consumable.relatedEquipment && (
          <div className="mt-4 border-t pt-4">
            <dt className="text-muted-foreground text-sm">
              {LABELS.linkedEquipment[locale]}
            </dt>
            <dd className="mt-1 font-medium">
              {consumable.relatedEquipment.nameVi}
            </dd>
            <dd className="text-muted-foreground text-xs">
              {consumable.relatedEquipment.nameEn}
            </dd>
          </div>
        )}
      </div>

      {/* Usage log and action forms side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UsageLogTable consumableId={consumableId} locale={locale} />
        </div>
        <div className="space-y-4">
          {/* Record Usage form — decrements stock and creates audit log entry */}
          {currentUserId ? (
            <RecordUsageForm
              consumableId={consumableId}
              usedBy={currentUserId}
              locale={locale}
            />
          ) : (
            <div className="text-muted-foreground rounded-lg border p-4 text-sm">
              {LABELS.signInToRecordUsage[locale]}
            </div>
          )}

          {/* Reorder form — for requesting more stock */}
          {currentUserId ? (
            <ReorderForm
              consumableId={consumableId}
              requestedBy={currentUserId}
              locale={locale}
            />
          ) : (
            <div className="text-muted-foreground rounded-lg border p-4 text-sm">
              {LABELS.signInToReorder[locale]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
