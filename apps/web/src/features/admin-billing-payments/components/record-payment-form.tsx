"use client";

/**
 * Form for recording a new payment. Includes org selector, amount,
 * payment method, bank details, and save/confirm buttons.
 *
 * vi: "Bieu mau ghi nhan thanh toan" / en: "Record payment form"
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";
import { RadioGroup, RadioGroupItem } from "@medilink/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";
import { Textarea } from "@medilink/ui/textarea";

import type { PaymentMethod, PaymentType } from "../types";
import { useRecordPayment } from "../hooks/use-payment-mutations";
import { adminPaymentLabels } from "../labels";

interface Organization {
  _id: string;
  name: string;
}

interface RecordPaymentFormProps {
  organizations: Organization[];
  locale?: "vi" | "en";
}

const PAYMENT_METHODS: PaymentMethod[] = [
  "bank_transfer",
  "cash",
  "momo",
  "vnpay",
  "other",
];

const PAYMENT_TYPES: PaymentType[] = [
  "subscription_new",
  "subscription_renewal",
  "ai_credits",
  "upgrade",
  "other",
];

export function RecordPaymentForm({
  organizations,
  locale = "vi",
}: RecordPaymentFormProps) {
  const router = useRouter();
  const recordPayment = useRecordPayment();
  const L = adminPaymentLabels;

  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [amountVnd, setAmountVnd] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("bank_transfer");
  const [paymentType, setPaymentType] =
    useState<PaymentType>("subscription_new");
  const [bankReference, setBankReference] = useState("");
  const [bankName, setBankName] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (confirmImmediately: boolean) => {
    if (!organizationId || !amountVnd) return;

    try {
      setLoading(true);
      await recordPayment({
        organizationId: organizationId as any,
        amountVnd: Number(amountVnd.replace(/[^0-9]/g, "")),
        paymentMethod,
        paymentType,
        bankReference: bankReference || undefined,
        bankName: bankName || undefined,
        transferDate: transferDate
          ? new Date(transferDate).getTime()
          : undefined,
        invoiceNumber: invoiceNumber || undefined,
        notes: notes || undefined,
        confirmImmediately,
      });
      router.push("/admin/billing/payments");
    } catch {
      // Error handled by Convex toast / error boundary
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="space-y-6"
    >
      {/* Organization selector */}
      <div className="space-y-2">
        <Label>{L.fields.organization[locale]}</Label>
        <Select value={organizationId} onValueChange={setOrganizationId}>
          <SelectTrigger>
            <SelectValue placeholder={L.placeholders.organization[locale]} />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org._id} value={org._id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payment type */}
      <div className="space-y-2">
        <Label>{L.fields.paymentType[locale]}</Label>
        <RadioGroup
          value={paymentType}
          onValueChange={(v) => setPaymentType(v as PaymentType)}
          className="flex flex-wrap gap-4"
        >
          {PAYMENT_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <RadioGroupItem value={type} id={`type-${type}`} />
              <Label htmlFor={`type-${type}`} className="cursor-pointer">
                {L.types[type][locale]}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label>{L.fields.amount[locale]}</Label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder={L.placeholders.amount[locale]}
          value={amountVnd}
          onChange={(e) => setAmountVnd(e.target.value)}
        />
      </div>

      {/* Payment method */}
      <div className="space-y-2">
        <Label>{L.fields.paymentMethod[locale]}</Label>
        <Select
          value={paymentMethod}
          onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {L.methods[method][locale]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bank details (shown for bank_transfer) */}
      {paymentMethod === "bank_transfer" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{L.fields.bankName[locale]}</Label>
            <Input
              placeholder={L.placeholders.bankName[locale]}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{L.fields.bankReference[locale]}</Label>
            <Input
              placeholder={L.placeholders.bankReference[locale]}
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Transfer date */}
      <div className="space-y-2">
        <Label>{L.fields.transferDate[locale]}</Label>
        <Input
          type="date"
          value={transferDate}
          onChange={(e) => setTransferDate(e.target.value)}
        />
      </div>

      {/* Invoice number (optional -- auto-generated if empty) */}
      <div className="space-y-2">
        <Label>
          {L.fields.invoiceNumber[locale]}{" "}
          <span className="text-muted-foreground text-xs">
            (
            {locale === "vi"
              ? "tự động nếu để trống"
              : "auto-generated if empty"}
            )
          </span>
        </Label>
        <Input
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>{L.fields.notes[locale]}</Label>
        <Textarea
          placeholder={L.placeholders.notes[locale]}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading || !organizationId || !amountVnd}
        >
          {loading ? L.loading[locale] : L.actions.confirmPayment[locale]}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={loading || !organizationId || !amountVnd}
        >
          {loading ? L.loading[locale] : L.actions.savePending[locale]}
        </Button>
      </div>
    </form>
  );
}
