"use client";

/**
 * Payment detail card showing all transfer information.
 *
 * vi: "The chi tiet thanh toan" / en: "Payment detail card"
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Separator } from "@medilink/ui/separator";
import { Skeleton } from "@medilink/ui/skeleton";

import type { PaymentDetail } from "../types";
import { adminPaymentLabels } from "../labels";
import { formatDateTime, formatVnd } from "../utils";
import { PaymentActions } from "./payment-actions";
import { PaymentStatusBadge } from "./payment-status-badge";

interface PaymentDetailCardProps {
  payment: PaymentDetail | null | undefined;
  isLoading: boolean;
  locale?: "vi" | "en";
}

export function PaymentDetailCard({
  payment,
  isLoading,
  locale = "vi",
}: PaymentDetailCardProps) {
  const L = adminPaymentLabels;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!payment) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {locale === "vi"
              ? "Khong tim thay thanh toan"
              : "Payment not found"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{L.detailTitle[locale]}</CardTitle>
            <CardDescription>{payment.invoiceNumber ?? "—"}</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <PaymentStatusBadge status={payment.status} locale={locale} />
            <PaymentActions
              paymentId={payment._id}
              status={payment.status}
              locale={locale}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic info */}
        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow
            label={L.fields.organization[locale]}
            value={payment.organizationName}
          />
          <DetailRow
            label={L.fields.amount[locale]}
            value={formatVnd(payment.amountVnd)}
          />
          <DetailRow
            label={L.fields.paymentType[locale]}
            value={L.types[payment.paymentType][locale]}
          />
          <DetailRow
            label={L.fields.paymentMethod[locale]}
            value={L.methods[payment.paymentMethod][locale]}
          />
          <DetailRow
            label={L.fields.status[locale]}
            value={L.statuses[payment.status][locale]}
          />
          <DetailRow
            label={L.fields.date[locale]}
            value={formatDateTime(payment.createdAt, locale)}
          />
        </div>

        <Separator />

        {/* Bank details */}
        {payment.paymentMethod === "bank_transfer" && (
          <>
            <h3 className="text-sm font-medium">
              {locale === "vi"
                ? "Thong tin chuyen khoan"
                : "Bank Transfer Details"}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label={L.fields.bankName[locale]}
                value={payment.bankName ?? "—"}
              />
              <DetailRow
                label={L.fields.bankReference[locale]}
                value={payment.bankReference ?? "—"}
              />
              <DetailRow
                label={L.fields.transferDate[locale]}
                value={
                  payment.transferDate
                    ? formatDateTime(payment.transferDate, locale)
                    : "—"
                }
              />
              <DetailRow
                label={L.fields.invoiceNumber[locale]}
                value={payment.invoiceNumber ?? "—"}
              />
            </div>
            <Separator />
          </>
        )}

        {/* Confirmation info */}
        {payment.confirmedAt && (
          <>
            <h3 className="text-sm font-medium">
              {locale === "vi" ? "Thong tin xac nhan" : "Confirmation Info"}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label={L.fields.confirmedBy[locale]}
                value={payment.confirmedByName ?? "—"}
              />
              <DetailRow
                label={L.fields.confirmedAt[locale]}
                value={formatDateTime(payment.confirmedAt, locale)}
              />
            </div>
            <Separator />
          </>
        )}

        {/* Rejection reason */}
        {payment.rejectionReason && (
          <>
            <DetailRow
              label={L.fields.rejectionReason[locale]}
              value={payment.rejectionReason}
            />
            <Separator />
          </>
        )}

        {/* Notes */}
        {payment.notes && (
          <DetailRow label={L.fields.notes[locale]} value={payment.notes} />
        )}
      </CardContent>
    </Card>
  );
}

// Simple key-value row component
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
