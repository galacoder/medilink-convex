/**
 * Activate subscription form page — /admin/billing/[organizationId]/activate
 *
 * Form for platform admin to activate a subscription for an organization.
 * Requires selecting a plan, billing cycle, and linking a confirmed payment.
 *
 * vi: "Trang kich hoat dang ky" / en: "Activate subscription page"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import type { Id } from "@medilink/db/dataModel";
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

import type { BillingCycle, SubscriptionPlan } from "~/features/admin-billing";
import {
  billingLabels,
  useBillingDetail,
  useBillingMutations,
} from "~/features/admin-billing";

// Plan pricing reference (VND)
const PLAN_PRICING: Record<string, Record<string, number>> = {
  starter: {
    monthly_3: 3_000_000,
    monthly_6: 5_000_000,
    monthly_12: 9_000_000,
  },
  professional: {
    monthly_3: 10_000_000,
    monthly_6: 18_000_000,
    monthly_12: 30_000_000,
  },
  enterprise: {
    monthly_3: 25_000_000,
    monthly_6: 45_000_000,
    monthly_12: 80_000_000,
  },
};

/**
 * Subscription activation form.
 *
 * vi: "Bieu mau kich hoat dang ky"
 * en: "Subscription activation form"
 */
export default function ActivateSubscriptionPage() {
  const params = useParams<{ organizationId: string }>();
  const router = useRouter();
  const locale = "vi";
  const L = billingLabels;

  const organizationId = params.organizationId as Id<"organizations">;
  const { detail } = useBillingDetail(organizationId);
  const { activateSubscription } = useBillingMutations();

  const [plan, setPlan] = useState<SubscriptionPlan | "">("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle | "">("");
  const [paymentIdInput, setPaymentIdInput] = useState("");
  const [amountVnd, setAmountVnd] = useState<number>(0);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill amount from plan pricing when plan + cycle selected
  const suggestedAmount =
    plan && billingCycle ? (PLAN_PRICING[plan]?.[billingCycle] ?? 0) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !billingCycle || !paymentIdInput) return;

    setIsPending(true);
    setError(null);

    try {
      await activateSubscription({
        organizationId,
        plan: plan as "starter" | "professional" | "enterprise",
        billingCycle: billingCycle as BillingCycle,
        paymentId: paymentIdInput as Id<"payments">,
        amountVnd: amountVnd || suggestedAmount,
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
          <CardTitle>{L.activateTitle[locale]}</CardTitle>
          <CardDescription>
            {detail?.organization.name ?? "..."} -{" "}
            {locale === "vi"
              ? "Chon goi va chu ky thanh toan"
              : "Select plan and billing cycle"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plan selection */}
            <div className="space-y-2">
              <Label>{L.selectPlan[locale]}</Label>
              <Select
                value={plan}
                onValueChange={(v) => setPlan(v as SubscriptionPlan)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      locale === "vi" ? "Chon goi..." : "Select plan..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">
                    {L.planStarter[locale]} (10{" "}
                    {locale === "vi" ? "nhan vien" : "staff"}, 100{" "}
                    {locale === "vi" ? "thiet bi" : "equipment"})
                  </SelectItem>
                  <SelectItem value="professional">
                    {L.planProfessional[locale]} (50{" "}
                    {locale === "vi" ? "nhan vien" : "staff"},{" "}
                    {L.unlimited[locale]}{" "}
                    {locale === "vi" ? "thiet bi" : "equipment"})
                  </SelectItem>
                  <SelectItem value="enterprise">
                    {L.planEnterprise[locale]} ({L.unlimited[locale]}{" "}
                    {locale === "vi" ? "nhan vien" : "staff"},{" "}
                    {L.unlimited[locale]}{" "}
                    {locale === "vi" ? "thiet bi" : "equipment"})
                  </SelectItem>
                </SelectContent>
              </Select>
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
                        ? "Chon chu ky..."
                        : "Select billing cycle..."
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
                value={amountVnd || suggestedAmount || ""}
                onChange={(e) => setAmountVnd(Number(e.target.value))}
                placeholder={
                  suggestedAmount
                    ? `${locale === "vi" ? "De xuat" : "Suggested"}: ${new Intl.NumberFormat("vi-VN").format(suggestedAmount)}`
                    : "0"
                }
              />
              {suggestedAmount > 0 && (
                <p className="text-muted-foreground text-xs">
                  {locale === "vi" ? "Gia de xuat" : "Suggested price"}:{" "}
                  {new Intl.NumberFormat("vi-VN").format(suggestedAmount)} VND
                </p>
              )}
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
                disabled={
                  isPending || !plan || !billingCycle || !paymentIdInput
                }
              >
                {isPending ? L.loading[locale] : L.activate[locale]}
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
