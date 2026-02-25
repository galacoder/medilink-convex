"use client";

/**
 * Admin payment list page — /admin/billing/payments
 *
 * Shows all payments with status filter, search, and quick actions.
 *
 * vi: "Trang danh sach thanh toan — Quan tri vien"
 * en: "Payment list page — Platform Admin"
 */
import { useState } from "react";
import Link from "next/link";

import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { PaymentFilters } from "~/features/admin-billing-payments";
import {
  adminPaymentLabels,
  PaymentFiltersBar,
  PaymentTable,
  useAdminPayments,
} from "~/features/admin-billing-payments";

export default function AdminPaymentsPage() {
  const locale = "vi"; // Default to Vietnamese
  const L = adminPaymentLabels;

  const [filters, setFilters] = useState<PaymentFilters>({});

  const { payments, total, isLoading } = useAdminPayments(filters);

  const handleFiltersChange = (newFilters: PaymentFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{L.title[locale]}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {L.subtitle[locale]}
          </p>
        </div>
        <Link href="/admin/billing/payments/new">
          <Button>{L.actions.recordPayment[locale]}</Button>
        </Link>
      </div>

      {/* Payment list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{L.title[locale]}</CardTitle>
              <CardDescription>
                {isLoading ? L.loading[locale] : `${total} ${"thanh toan"}`}
              </CardDescription>
            </div>
            <PaymentFiltersBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              locale={locale}
            />
          </div>
        </CardHeader>
        <CardContent>
          <PaymentTable
            payments={payments}
            isLoading={isLoading}
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  );
}
