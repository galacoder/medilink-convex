"use client";

/**
 * Payment list table with status badges and quick actions.
 *
 * vi: "Bang danh sach thanh toan" / en: "Payment list table"
 */
import Link from "next/link";

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

import type { PaymentListItem } from "../types";
import { adminPaymentLabels } from "../labels";
import { formatDate, formatVnd } from "../utils";
import { PaymentStatusBadge } from "./payment-status-badge";

interface PaymentTableProps {
  payments: PaymentListItem[];
  isLoading: boolean;
  locale?: "vi" | "en";
}

export function PaymentTable({
  payments,
  isLoading,
  locale = "vi",
}: PaymentTableProps) {
  const L = adminPaymentLabels;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-lg">
          {L.empty.noPayments[locale]}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {L.empty.noPaymentsDesc[locale]}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{L.fields.date[locale]}</TableHead>
          <TableHead>{L.fields.organization[locale]}</TableHead>
          <TableHead className="text-right">
            {L.fields.amount[locale]}
          </TableHead>
          <TableHead>{L.fields.status[locale]}</TableHead>
          <TableHead>{L.fields.paymentType[locale]}</TableHead>
          <TableHead>{L.fields.paymentMethod[locale]}</TableHead>
          <TableHead>{L.fields.invoiceNumber[locale]}</TableHead>
          <TableHead>{L.fields.actions[locale]}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment._id}>
            <TableCell className="whitespace-nowrap">
              {formatDate(payment.createdAt, locale)}
            </TableCell>
            <TableCell className="font-medium">
              {payment.organizationName}
            </TableCell>
            <TableCell className="text-right whitespace-nowrap">
              {formatVnd(payment.amountVnd)}
            </TableCell>
            <TableCell>
              <PaymentStatusBadge status={payment.status} locale={locale} />
            </TableCell>
            <TableCell>
              {L.types[payment.paymentType][locale]}
            </TableCell>
            <TableCell>
              {L.methods[payment.paymentMethod][locale]}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {payment.invoiceNumber ?? "—"}
            </TableCell>
            <TableCell>
              <Link href={`/admin/billing/payments/${payment._id}`}>
                <Button variant="ghost" size="sm">
                  {L.actions.viewDetail[locale]}
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
