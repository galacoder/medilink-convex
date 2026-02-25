"use client";

/**
 * Payment detail page — /admin/billing/payments/[paymentId]
 *
 * Shows full payment information with confirmation/rejection/void actions.
 *
 * vi: "Trang chi tiet thanh toan — Quan tri vien"
 * en: "Payment detail page — Platform Admin"
 */
import { use } from "react";
import Link from "next/link";

import { Button } from "@medilink/ui/button";

import {
  adminPaymentLabels,
  PaymentDetailCard,
  usePaymentDetail,
} from "~/features/admin-billing-payments";

interface PaymentDetailPageProps {
  params: Promise<{ paymentId: string }>;
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { paymentId } = use(params);
  const locale = "vi";
  const L = adminPaymentLabels;

  const { payment, isLoading } = usePaymentDetail(paymentId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/billing/payments">
          <Button variant="ghost" size="sm">
            {L.actions.back[locale]} ←
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{L.detailTitle[locale]}</h1>
        </div>
      </div>

      {/* Payment detail card */}
      <PaymentDetailCard
        payment={payment}
        isLoading={isLoading}
        locale={locale}
      />
    </div>
  );
}
