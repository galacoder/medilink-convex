/**
 * Subscription and payment history tables.
 *
 * vi: "Bang lich su dang ky va thanh toan"
 * en: "Subscription and payment history tables"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@medilink/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";

import type { PaymentRecord, SubscriptionRecord } from "../types";
import { billingLabels } from "../labels";
import { StatusBadge } from "./status-badge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(timestamp: number, locale: "vi" | "en"): string {
  return new Date(timestamp).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US",
    { year: "numeric", month: "2-digit", day: "2-digit" },
  );
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

// ---------------------------------------------------------------------------
// SubscriptionHistoryTable
// ---------------------------------------------------------------------------

interface SubscriptionHistoryTableProps {
  history: SubscriptionRecord[];
  locale?: "vi" | "en";
}

/**
 * Renders subscription history as a table.
 *
 * vi: "Hien thi lich su dang ky" / en: "Display subscription history"
 */
export function SubscriptionHistoryTable({
  history,
  locale = "vi",
}: SubscriptionHistoryTableProps) {
  const L = billingLabels;

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {L.subscriptionHistory[locale]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {locale === "vi"
              ? "Chua co lich su dang ky"
              : "No subscription history"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {L.subscriptionHistory[locale]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L.date[locale]}</TableHead>
                <TableHead>{L.plan[locale]}</TableHead>
                <TableHead>{L.status[locale]}</TableHead>
                <TableHead>{L.amountVnd[locale]}</TableHead>
                <TableHead>{L.billingCycle[locale]}</TableHead>
                <TableHead>{L.aiCredits[locale]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((sub) => (
                <TableRow key={sub._id}>
                  <TableCell>{formatDate(sub.createdAt, locale)}</TableCell>
                  <TableCell className="capitalize">{sub.plan}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={
                        sub.status as
                          | "active"
                          | "trial"
                          | "grace_period"
                          | "expired"
                          | "suspended"
                      }
                      locale={locale}
                    />
                  </TableCell>
                  <TableCell>{formatVnd(sub.amountVnd)}</TableCell>
                  <TableCell>{sub.billingCycle}</TableCell>
                  <TableCell>{sub.monthlyAiCredits}/mo</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PaymentHistoryTable
// ---------------------------------------------------------------------------

interface PaymentHistoryTableProps {
  payments: PaymentRecord[];
  locale?: "vi" | "en";
}

/**
 * Renders payment history as a table.
 *
 * vi: "Hien thi lich su thanh toan" / en: "Display payment history"
 */
export function PaymentHistoryTable({
  payments,
  locale = "vi",
}: PaymentHistoryTableProps) {
  const L = billingLabels;

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{L.paymentHistory[locale]}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {locale === "vi"
              ? "Chua co lich su thanh toan"
              : "No payment history"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{L.paymentHistory[locale]}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L.date[locale]}</TableHead>
                <TableHead>{L.amountVnd[locale]}</TableHead>
                <TableHead>
                  {locale === "vi" ? "Phuong thuc" : "Method"}
                </TableHead>
                <TableHead>{L.status[locale]}</TableHead>
                <TableHead>{locale === "vi" ? "Loai" : "Type"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>{formatDate(p.createdAt, locale)}</TableCell>
                  <TableCell>{formatVnd(p.amountVnd)}</TableCell>
                  <TableCell className="capitalize">
                    {p.paymentMethod.replace("_", " ")}
                  </TableCell>
                  <TableCell className="capitalize">{p.status}</TableCell>
                  <TableCell className="capitalize">
                    {p.paymentType.replace("_", " ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
