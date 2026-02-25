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

// Build a typed reference for admin.hospitals.listHospitals
// The admin namespace is dynamically registered at runtime
type QueryRef = FunctionReference<"query">;

interface AdminHospitalsApi {
  hospitals: { listHospitals: QueryRef };
}

const listHospitalsFn: QueryRef = (
  api as unknown as { admin: AdminHospitalsApi }
).admin.hospitals.listHospitals;

interface HospitalListResult {
  hospitals: { _id: string; name: string }[];
}

export default function RecordPaymentPage() {
  const locale = "vi";
  const L = adminPaymentLabels;

  // Fetch organizations for the selector
  const orgsResult = useQuery(listHospitalsFn, { pageSize: 100 }) as
    | HospitalListResult
    | undefined;

  const isLoading = orgsResult === undefined;
  const organizations = (orgsResult?.hospitals ?? []).map((h) => ({
    _id: h._id,
    name: h.name,
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
