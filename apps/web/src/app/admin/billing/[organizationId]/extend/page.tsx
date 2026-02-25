/**
 * Extend subscription form page — /admin/billing/[organizationId]/extend
 *
 * Form for platform admin to extend/renew a subscription.
 * KEY: Extension adds time from current expiresAt, not from today.
 *
 * vi: "Trang gia han dang ky" / en: "Extend subscription page"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import type { Id } from "@medilink/backend";
import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";

import type { BillingCycle } from "~/features/admin-billing";
import {
  billingLabels,
  useBillingDetail,
  useBillingMutations,
} from "~/features/admin-billing";

/**
 * Subscription extension form.
 *
 * vi: "Bieu mau gia han dang ky"
 * en: "Subscription extension form"
 */
export default function ExtendSubscriptionPage() {
  const params = useParams<{ organizationId: string }>();
  const router = useRouter();
  const locale = "vi";
  const L = billingLabels;

  const organizationId = params.organizationId as Id<"organizations">;
  const { detail } = useBillingDetail(organizationId);
  const { extendSubscription } = useBillingMutations();

  const [billingCycle, setBillingCycle] = useState<BillingCycle | "">("");
  const [paymentIdInput, setPaymentIdInput] = useState("");
  const [amountVnd, setAmountVnd] = useState<number>(0);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentExpiresAt = detail?.organization.subscriptionExpiresAt;
  const currentPlan = detail?.organization.subscriptionPlan;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingCycle || !paymentIdInput) return;

    setIsPending(true);
    setError(null);

    try {
      await extendSubscription({
        organizationId,
        billingCycle: billingCycle as BillingCycle,
        paymentId: paymentIdInput as Id<"payments">,
        amountVnd,
      });
      router.push(`/admin/billing/${organizationId}`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  /** Format date for display */
  function formatDate(ts: number | null | undefined): string {
    if (!ts) return "--";
    return new Date(ts).toLocaleDateString(
      locale === "vi" ? "vi-VN" : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/billing/${organizationId}`}>
          {locale === "vi" ? "\u2190 Quay lai" : "\u2190 Back"}
        </Link>
      </Button>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{L.extendTitle[locale]}</CardTitle>
          <CardDescription>
            {detail?.organization.name ?? "..."} -{" "}
            {locale === "vi"
              ? "Gia han them thoi gian tu ngay het han hien tai"
              : "Add time from current expiry date"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current subscription info */}
            <div className="bg-muted rounded-lg p-4">
              <h3 className="mb-2 text-sm font-medium">
                {L.currentSubscription[locale]}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {L.plan[locale]}:
                  </span>{" "}
                  <span className="font-medium capitalize">
                    {currentPlan ?? "--"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {L.expires[locale]}:
                  </span>{" "}
                  <span className="font-medium">
                    {formatDate(currentExpiresAt)}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                {locale === "vi"
                  ? "Thoi gian gia han se duoc cong tu ngay het han hien tai, khong phai tu hom nay"
                  : "Extension time will be added from the current expiry date, not from today"}
              </p>
            </div>

            {/* Billing cycle */}
            <div className="space-y-2">
              <Label>{L.billingCycle[locale]}</Label>
              <Select
                value={billingCycle}
                onValueChange={(v) => setBillingCycle(v as BillingCycle)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      locale === "vi"
                        ? "Chon chu ky gia han..."
                        : "Select extension period..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly_3">{L.cycle3[locale]}</SelectItem>
                  <SelectItem value="monthly_6">{L.cycle6[locale]}</SelectItem>
                  <SelectItem value="monthly_12">
                    {L.cycle12[locale]}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>{L.amount[locale]}</Label>
              <Input
                type="number"
                value={amountVnd || ""}
                onChange={(e) => setAmountVnd(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            {/* Payment ID */}
            <div className="space-y-2">
              <Label>{L.paymentId[locale]}</Label>
              <Input
                value={paymentIdInput}
                onChange={(e) => setPaymentIdInput(e.target.value)}
                placeholder={
                  locale === "vi"
                    ? "ID thanh toan da xac nhan"
                    : "Confirmed payment ID"
                }
              />
            </div>

            {/* Error display */}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Submit */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isPending || !billingCycle || !paymentIdInput}
              >
                {isPending ? L.loading[locale] : L.extend[locale]}
              </Button>
              <Button variant="outline" type="button" asChild>
                <Link href={`/admin/billing/${organizationId}`}>
                  {L.cancel[locale]}
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
