/**
 * AI credit consumption history table.
 *
 * WHY: Provides an audit log of AI credit usage for the organization.
 * Shows who used which AI feature, how many credits, and the status.
 * Refunded records are visually distinguished with strikethrough.
 *
 * vi: "Bang lich su tieu thu credit AI"
 * en: "AI credit consumption history table"
 *
 * @see Issue #177 -- M1-8: AI Credit Balance UI
 */
"use client";

import { useQuery } from "convex/react";

import type { Id } from "@medilink/backend";
import { Badge } from "@medilink/ui/badge";
import { Skeleton } from "@medilink/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";

import type { CreditConsumptionRecord } from "../lib/credit-api";
import { AI_CREDIT_COSTS } from "../../../../../../convex/billing/creditCosts";
import { creditQueriesApi } from "../lib/credit-api";
import { ConsumptionStatusBadge } from "./consumption-status-badge";

interface CreditHistoryTableProps {
  organizationId: Id<"organizations">;
}

function formatTime(timestamp: number): string {
  const locale = "vi" as string;
  return new Date(timestamp).toLocaleString(
    locale === "vi" ? "vi-VN" : "en-US",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  );
}

function CreditHistorySkeleton() {
  return (
    <div data-testid="credit-history-skeleton" className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={`skeleton-${i.toString()}`} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function CreditHistoryTable({
  organizationId,
}: CreditHistoryTableProps) {
  const history = useQuery(creditQueriesApi.getCreditConsumptionHistory, {
    organizationId,
    limit: 50,
  }) as CreditConsumptionRecord[] | undefined;

  if (history === undefined) return <CreditHistorySkeleton />;

  if (history.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        Chua co lich su su dung credit AI. / No AI credit usage history yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Thoi gian / Time</TableHead>
          <TableHead>Nguoi dung / User</TableHead>
          <TableHead>Tinh nang / Feature</TableHead>
          <TableHead>Credits</TableHead>
          <TableHead>Trang thai / Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((record) => {
          const featureLabel =
            (
              AI_CREDIT_COSTS as Record<
                string,
                { descriptionVi: string } | undefined
              >
            )[record.featureId]?.descriptionVi ?? record.featureId;

          return (
            <TableRow key={record._id}>
              <TableCell className="text-xs">
                {formatTime(record.createdAt)}
              </TableCell>
              <TableCell>{record.userName}</TableCell>
              <TableCell className="text-sm">{featureLabel}</TableCell>
              <TableCell>
                <span
                  className={record.status === "refunded" ? "line-through" : ""}
                >
                  {record.creditsUsed}
                </span>
                {record.status === "refunded" && (
                  <Badge variant="outline" className="ml-1 text-xs">
                    Hoan tra / Refunded
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <ConsumptionStatusBadge
                  status={
                    record.status as
                      | "pending"
                      | "completed"
                      | "failed"
                      | "refunded"
                  }
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
