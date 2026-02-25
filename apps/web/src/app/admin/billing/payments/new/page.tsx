"use client";

/**
 * Record new payment page — /admin/billing/payments/new
 *
 * Form for recording a bank transfer payment against an organization.
 *
 * vi: "Trang ghi nhan thanh toan moi — Quan tri vien"
 * en: "Record new payment page — Platform Admin"
 */
import type { FunctionReference } from "convex/server";
import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@medilink/backend";
import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Skeleton } from "@medilink/ui/skeleton";

import {
  adminPaymentLabels,
  RecordPaymentForm,
} from "~/features/admin-billing-payments";

// Cast the api reference for admin.hospitals.listHospitals
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const adminHospitalsApi = (api as any).admin?.hospitals;
type QueryRef = FunctionReference<"query">;
const listHospitalsFn: QueryRef = adminHospitalsApi?.listHospitals;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

export default function RecordPaymentPage() {
  const locale = "vi";
  const L = adminPaymentLabels;

  // Fetch organizations for the selector
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const orgsResult = useQuery(listHospitalsFn, { pageSize: 100 });

  const isLoading = orgsResult === undefined;
  const organizations =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((orgsResult as any)?.hospitals ?? []).map((h: any) => ({
      _id: h._id as string,
      name: h.name as string,
    }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/billing/payments">
          <Button variant="ghost" size="sm">
            {L.actions.back[locale]} ←
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{L.recordTitle[locale]}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {L.recordSubtitle[locale]}
          </p>
        </div>
      </div>

      {/* Form card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{L.recordTitle[locale]}</CardTitle>
          <CardDescription>{L.recordSubtitle[locale]}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <RecordPaymentForm organizations={organizations} locale={locale} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
