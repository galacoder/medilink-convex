"use client";

/**
 * Platform admin hospital detail page.
 *
 * WHY: Provides deep visibility into a specific hospital organization —
 * full org info, member list, equipment summary, service request summary,
 * and usage metrics. Platform admins can take action (suspend/reactivate)
 * from this page.
 *
 * This is a client component because it uses Convex real-time hooks
 * (useHospitalDetail) and mounts client-only action dialogs.
 *
 * vi: "Trang chi tiết bệnh viện — Quản trị viên nền tảng"
 * en: "Hospital detail page — Platform Admin"
 */
import type { Id } from "@medilink/db/dataModel";
import { use } from "react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import {
  HospitalStatusBadge,
  ReactivateHospitalDialog,
  SuspendHospitalDialog,
  useHospitalDetail,
} from "~/features/admin-hospitals";
import { adminHospitalLabels } from "~/features/admin-hospitals/labels";

interface HospitalDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Hospital detail page for platform admin.
 * Shows org info, member list, equipment summary, usage metrics, and action buttons.
 *
 * vi: "Trang chi tiết bệnh viện" / en: "Hospital detail page"
 */
export default function HospitalDetailPage({
  params,
}: HospitalDetailPageProps) {
  const { id } = use(params);
  const locale = "vi";
  const L = adminHospitalLabels;

  const hospitalId = id as Id<"organizations">;
  const { detail, usage, isLoading, isUsageLoading } =
    useHospitalDetail(hospitalId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="bg-muted h-4 w-48 animate-pulse rounded" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          Không tìm thấy bệnh viện {/* Hospital not found */}
        </p>
        <Link
          href="/admin/hospitals"
          className="text-primary mt-2 inline-block text-sm hover:underline"
        >
          {L.actions.back[locale]}
        </Link>
      </div>
    );
  }

  const { organization, members, equipmentSummary, serviceRequestSummary } =
    detail;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/hospitals"
          className="text-muted-foreground hover:text-foreground"
        >
          {L.breadcrumb.hospitals[locale]}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{organization.name}</span>
      </div>

      {/* Header with action buttons */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{organization.name}</h1>
            <HospitalStatusBadge status={organization.status} locale={locale} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {organization.slug}
          </p>
        </div>
        <div className="flex gap-2">
          {organization.status !== "suspended" ? (
            <SuspendHospitalDialog
              hospitalId={hospitalId}
              hospitalName={organization.name}
              locale={locale}
            />
          ) : (
            <ReactivateHospitalDialog
              hospitalId={hospitalId}
              hospitalName={organization.name}
              locale={locale}
            />
          )}
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {L.fields.memberCount[locale]} {/* Số thành viên */}
            </CardDescription>
            <CardTitle className="text-3xl">
              {isUsageLoading ? "--" : (usage?.activeMembers ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {L.fields.equipmentCount[locale]} {/* Số thiết bị */}
            </CardDescription>
            <CardTitle className="text-3xl">
              {isUsageLoading ? "--" : (usage?.equipmentCount ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Yêu cầu dịch vụ {/* Service Requests */}
            </CardDescription>
            <CardTitle className="text-3xl">
              {isUsageLoading ? "--" : (usage?.serviceRequestCount ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Equipment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {L.sections.equipment[locale]}
          </CardTitle>
          <CardDescription>
            {L.equipmentStatuses.available[locale]}:{" "}
            {equipmentSummary.available} · {L.equipmentStatuses.inUse[locale]}:{" "}
            {equipmentSummary.inUse} · {L.equipmentStatuses.maintenance[locale]}
            : {equipmentSummary.maintenance} ·{" "}
            {L.equipmentStatuses.damaged[locale]}: {equipmentSummary.damaged}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold">
                {equipmentSummary.available}
              </p>
              <p className="text-muted-foreground text-xs">
                {L.equipmentStatuses.available[locale]}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{equipmentSummary.inUse}</p>
              <p className="text-muted-foreground text-xs">
                {L.equipmentStatuses.inUse[locale]}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {equipmentSummary.maintenance}
              </p>
              <p className="text-muted-foreground text-xs">
                {L.equipmentStatuses.maintenance[locale]}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {equipmentSummary.damaged}
              </p>
              <p className="text-muted-foreground text-xs">
                {L.equipmentStatuses.damaged[locale]}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {equipmentSummary.retired}
              </p>
              <p className="text-muted-foreground text-xs">
                {L.equipmentStatuses.retired[locale]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Request Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {L.sections.serviceRequests[locale]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold">
                {serviceRequestSummary.total}
              </p>
              <p className="text-muted-foreground text-xs">
                Tổng {/* Total */}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {serviceRequestSummary.pending}
              </p>
              <p className="text-muted-foreground text-xs">
                Đang chờ {/* Pending */}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {serviceRequestSummary.inProgress}
              </p>
              <p className="text-muted-foreground text-xs">
                Đang thực hiện {/* In Progress */}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {serviceRequestSummary.completed}
              </p>
              <p className="text-muted-foreground text-xs">
                Hoàn thành {/* Completed */}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {L.sections.members[locale]}
          </CardTitle>
          <CardDescription>
            {members.length} {L.fields.memberCount[locale]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {L.empty.noMembers[locale]}
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.membershipId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {member.email}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {L.roles[member.role][locale]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
