/**
 * Full-page suspended account message.
 *
 * WHY: When an admin suspends an organization, all access is blocked.
 * This page communicates the situation and provides a contact CTA.
 * Different from expired — suspended is an admin action, not payment lapse.
 *
 * vi: "Trang tai khoan bi tam ngung"
 * en: "Suspended account page"
 */
"use client";

import { Ban, Mail } from "lucide-react";

import { Button } from "@medilink/ui/button";
import { Card, CardContent } from "@medilink/ui/card";

import { BILLING_LABELS } from "../labels";

export function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="mx-auto max-w-lg p-8 text-center">
        <CardContent className="space-y-4">
          <Ban className="text-muted-foreground mx-auto h-16 w-16" />
          <h2 className="text-2xl font-bold">
            {BILLING_LABELS.suspendedTitle.vi} /{" "}
            {BILLING_LABELS.suspendedTitle.en}
          </h2>
          <p className="text-muted-foreground">
            {BILLING_LABELS.suspendedDescription.vi} /{" "}
            {BILLING_LABELS.suspendedDescription.en}
          </p>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            {BILLING_LABELS.suspendedCta.vi} / {BILLING_LABELS.suspendedCta.en}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
