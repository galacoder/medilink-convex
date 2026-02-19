"use client";

/**
 * Transaction history table for consumable stock movements.
 * Shows RECEIVE, USAGE, ADJUSTMENT, WRITE_OFF, EXPIRED transactions.
 *
 * vi: "Bảng lịch sử giao dịch vật tư" / en: "Consumable transaction history table"
 */
// WHY: convex/_generated/dataModel is gitignored (generated at runtime by `npx convex dev`).
// GenericId<T> from convex/values is the stable npm-package equivalent of the generated Id<T>.
import type { GenericId as Id } from "convex/values";

import { useConsumableUsageLog } from "../hooks/useConsumables";

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------

const LABELS = {
  title: { vi: "Lịch sử giao dịch", en: "Transaction History" },
  type: { vi: "Loại giao dịch", en: "Type" },
  quantity: { vi: "Số lượng", en: "Quantity" },
  date: { vi: "Ngày", en: "Date" },
  notes: { vi: "Ghi chú", en: "Notes" },
  noData: { vi: "Chưa có giao dịch nào", en: "No transactions yet" },
  loadMore: { vi: "Tải thêm", en: "Load more" },
} as const;

const TRANSACTION_LABELS: Record<
  "RECEIVE" | "USAGE" | "ADJUSTMENT" | "WRITE_OFF" | "EXPIRED",
  { vi: string; en: string; color: string }
> = {
  RECEIVE: {
    vi: "Nhận hàng",
    en: "Receive",
    color: "bg-green-100 text-green-800",
  },
  USAGE: {
    vi: "Sử dụng",
    en: "Usage",
    color: "bg-blue-100 text-blue-800",
  },
  ADJUSTMENT: {
    vi: "Điều chỉnh",
    en: "Adjustment",
    color: "bg-amber-100 text-amber-800",
  },
  WRITE_OFF: {
    vi: "Xóa sổ",
    en: "Write-off",
    color: "bg-red-100 text-red-800",
  },
  EXPIRED: {
    vi: "Hết hạn",
    en: "Expired",
    color: "bg-gray-100 text-gray-800",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UsageLogTableProps {
  consumableId: Id<"consumables">;
  locale?: "vi" | "en";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Paginated transaction history for a consumable (descending order).
 *
 * vi: "Lịch sử giao dịch vật tư" / en: "Consumable usage log table"
 */
export function UsageLogTable({
  consumableId,
  locale = "vi",
}: UsageLogTableProps) {
  const { results, status, loadMore } = useConsumableUsageLog(consumableId, 20);

  return (
    <div className="space-y-4" data-testid="usage-log">
      <h3 className="text-base font-semibold">{LABELS.title[locale]}</h3>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                {LABELS.type[locale]}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {LABELS.quantity[locale]}
              </th>
              <th className="px-4 py-3 text-left font-medium">
                {LABELS.date[locale]}
              </th>
              <th className="px-4 py-3 text-left font-medium">
                {LABELS.notes[locale]}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {results.length === 0 && status === "Exhausted" ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-muted-foreground px-4 py-8 text-center text-sm"
                >
                  {LABELS.noData[locale]}
                </td>
              </tr>
            ) : (
              results.map((entry) => {
                const txType = entry.transactionType;
                const txLabel = TRANSACTION_LABELS[txType];

                return (
                  <tr key={entry._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${txLabel.color}`}
                      >
                        {txLabel[locale]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {txType === "USAGE" ||
                      txType === "WRITE_OFF" ||
                      txType === "EXPIRED"
                        ? `-${entry.quantity}`
                        : `+${entry.quantity}`}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {new Date(entry.createdAt).toLocaleDateString(
                        locale === "vi" ? "vi-VN" : "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {entry.notes ?? "—"}
                    </td>
                  </tr>
                );
              })
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
