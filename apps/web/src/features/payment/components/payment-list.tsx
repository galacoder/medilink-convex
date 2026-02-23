"use client";

import { useState } from "react";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import { Skeleton } from "@medilink/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";

import type { Payment, PaymentStatus } from "../types";
import { paymentLabels } from "../labels";
import { PaymentStatusBadge } from "./payment-status-badge";

interface PaymentListProps {
  payments: Payment[];
  isLoading?: boolean;
}

const STATUS_TABS: (PaymentStatus | "all")[] = [
  "all",
  "pending",
  "completed",
  "failed",
  "refunded",
];

/**
 * Formats a number as Vietnamese currency (VND).
 *
 * WHY: Vietnamese currency uses dot separators and the VND symbol.
 * This helper provides consistent formatting across the payment list.
 */
function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("vi-VN")} ${currency}`;
  }
}

/**
 * Payment list with status filter tabs and sortable table.
 *
 * WHY: Provides a filterable table of payments. This is an intentionally
 * minimal stub for future payment processing integration. The table shows
 * date, description, amount, and status.
 *
 * vi: "Danh sach thanh toan" / en: "Payment list"
 */
export function PaymentList({ payments, isLoading = false }: PaymentListProps) {
  const [activeTab, setActiveTab] = useState<PaymentStatus | "all">("all");

  // Filter payments by status tab
  const filteredPayments =
    activeTab === "all"
      ? payments
      : payments.filter((p) => p.status === activeTab);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <Skeleton key={tab} className="h-8 w-20 rounded-md" />
          ))}
        </div>
        <div className="overflow-hidden rounded-md border">
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = tab === activeTab;
          const count =
            tab === "all"
              ? payments.length
              : payments.filter((p) => p.status === tab).length;
          const label =
            tab === "all"
              ? paymentLabels.filterTabs.all.vi
              : paymentLabels.filterTabs[tab].vi;

          return (
            <Button
              key={tab}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="gap-1.5"
            >
              {label}
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-[20px] px-1.5 text-xs"
              >
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-16 text-center">
          <p className="text-muted-foreground text-lg font-medium">
            {paymentLabels.empty.noPayments.vi}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {paymentLabels.empty.noPaymentsDesc.vi}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{paymentLabels.date.vi}</TableHead>
                <TableHead>{paymentLabels.fields.descriptionVi.vi}</TableHead>
                <TableHead className="text-right">
                  {paymentLabels.fields.amount.vi}
                </TableHead>
                <TableHead>{paymentLabels.fields.status.vi}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {new Date(payment.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate font-medium">
                    {payment.descriptionVi}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} locale="vi" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
