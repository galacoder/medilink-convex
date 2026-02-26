/**
 * Full-page overlay shown when the organization subscription is expired.
 *
 * WHY: When grace period ends, the organization is fully expired.
 * This overlay blocks all interaction (cannot be dismissed) and
 * provides contact CTAs so the admin can renew.
 *
 * vi: "Lop phu toan trang khi dang ky het han"
 * en: "Full-page overlay when subscription is expired"
 */
"use client";

import { Mail, Phone, XCircle } from "lucide-react";

import { Button } from "@medilink/ui/button";
import { Card, CardContent } from "@medilink/ui/card";

import { BILLING_LABELS } from "../labels";

export function ExpiredOverlay() {
  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <Card className="mx-auto max-w-lg p-8 text-center">
        <CardContent className="space-y-4">
          <XCircle className="text-destructive mx-auto h-16 w-16" />
          <h2 className="text-2xl font-bold">
            {BILLING_LABELS.expiredTitle.vi} / {BILLING_LABELS.expiredTitle.en}
          </h2>
          <p className="text-muted-foreground">
            {BILLING_LABELS.expiredDescription.vi} /{" "}
            {BILLING_LABELS.expiredDescription.en}
          </p>
          <div className="space-y-3">
            <Button className="w-full" size="lg">
              <Phone className="mr-2 h-4 w-4" />
              {BILLING_LABELS.expiredContactCta.vi} /{" "}
              {BILLING_LABELS.expiredContactCta.en}
            </Button>
            <Button variant="outline" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              {BILLING_LABELS.expiredRenewalCta.vi} /{" "}
              {BILLING_LABELS.expiredRenewalCta.en}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            {BILLING_LABELS.expiredHotline}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
