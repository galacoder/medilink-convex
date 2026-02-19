"use client";

/**
 * QuoteComparisonCard component — displays a single provider quote.
 *
 * WHY: Hospital staff compare provider quotes side by side. This card shows
 * all relevant quote info: formatted VND amount, provider name, validity date,
 * notes, and status. Accept/Reject buttons use AlertDialog for confirmation
 * to prevent accidental clicks on important financial decisions.
 *
 * VND formatting: Vietnamese locale (vi-VN) displays amounts like "500.000 ₫"
 */
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@medilink/ui/alert-dialog";
import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { Quote, QuoteStatus } from "../types";
import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";

interface QuoteComparisonCardProps {
  quote: Quote;
  onAccept: (quoteId: string) => Promise<void>;
  onReject: (quoteId: string) => Promise<void>;
}

const quoteStatusVariant: Record<
  QuoteStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  accepted: "default",
  rejected: "destructive",
  expired: "secondary",
};

/** Formats a number as Vietnamese Dong currency */
function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/** Formats an epoch ms timestamp as Vietnamese date */
function formatDate(epochMs: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(epochMs));
}

const labels = serviceRequestLabels.quotes;

export function QuoteComparisonCard({
  quote,
  onAccept,
  onReject,
}: QuoteComparisonCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const canAct = quote.status === "pending";

  async function handleAccept() {
    setIsAccepting(true);
    try {
      await onAccept(quote._id);
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);
    try {
      await onReject(quote._id);
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">
            {quote.providerOrgName ??
              quote.providerNameVi ??
              labels.provider.vi}
          </CardTitle>
          {quote.providerNameVi && quote.providerOrgName && (
            <p className="text-muted-foreground text-sm">
              {quote.providerNameVi}
            </p>
          )}
        </div>
        <Badge variant={quoteStatusVariant[quote.status]}>
          {labels.status[quote.status].vi}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Amount */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {labels.amount.vi}
          </span>
          <span className="text-2xl font-bold">{formatVND(quote.amount)}</span>
        </div>

        {/* Valid until */}
        {quote.validUntil && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {labels.validUntil.vi}
            </span>
            <span>{formatDate(quote.validUntil)}</span>
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">{labels.notes.vi}</p>
            <p className="text-sm">{quote.notes}</p>
          </div>
        )}
      </CardContent>

      {/* Action buttons (only for pending quotes) */}
      {canAct && (
        <CardFooter className="gap-3">
          {/* Accept with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" disabled={isAccepting}>
                {isAccepting ? labels.accepting.vi : labels.accept.vi}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {labels.acceptConfirmTitle.vi}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {labels.acceptConfirmDesc.vi}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {serviceRequestLabels.buttons.cancel.vi}
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleAccept}>
                  {labels.accept.vi}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reject with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isRejecting}>
                {isRejecting ? labels.rejecting.vi : labels.reject.vi}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {labels.rejectConfirmTitle.vi}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {labels.rejectConfirmDesc.vi}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {serviceRequestLabels.buttons.cancel.vi}
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleReject}>
                  {labels.reject.vi}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}
