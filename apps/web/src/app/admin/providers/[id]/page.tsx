"use client";

import { use } from "react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Separator } from "@medilink/ui/separator";

import type {
  AdminCertification,
  AdminCoverageArea,
  AdminServiceOffering,
} from "~/features/admin-providers";
import {
  adminProviderLabels,
  ProviderActions,
  ProviderStatusBadge,
  useAdminProviderDetail,
  useProviderPerformance,
  VerificationStatusBadge,
} from "~/features/admin-providers";

interface AdminProviderDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Platform admin provider detail page.
 *
 * WHY: Admin detail view shows all provider information needed to make
 * approval/rejection/suspension decisions: org info, service offerings,
 * certifications, coverage areas, and live performance metrics.
 *
 * Uses React 19 `use()` for async params per Next.js App Router convention.
 *
 * vi: "Trang chi tiết nhà cung cấp (quản trị viên nền tảng)"
 * en: "Platform admin provider detail page"
 */
export default function AdminProviderDetailPage({
  params,
}: AdminProviderDetailPageProps) {
  const { id } = use(params);
  const labels = adminProviderLabels;

  const { provider, isLoading } = useAdminProviderDetail(id);
  const { metrics, isLoading: metricsLoading } = useProviderPerformance(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="bg-muted h-48 animate-pulse rounded" />
        <div className="bg-muted h-48 animate-pulse rounded" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">
          Không tìm thấy nhà cung cấp {/* Provider not found */}
        </p>
        <Link
          href="/admin/providers"
          className="text-primary mt-2 block text-sm hover:underline"
        >
          {labels.actions.backToList.vi} {/* Danh sách nhà cung cấp */}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + page header */}
      <div>
        <Link
          href="/admin/providers"
          className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
        >
          ← {labels.actions.backToList.vi}
          {/* Danh sách nhà cung cấp */}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {provider.nameVi}
              {/* Vietnamese name (primary) */}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {provider.nameEn} {/* English name (secondary) */}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ProviderStatusBadge status={provider.status} />
            <VerificationStatusBadge status={provider.verificationStatus} />
          </div>
        </div>
      </div>

      {/* Admin action buttons */}
      <ProviderActions provider={provider} />

      {/* Provider information card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {labels.sections.providerInfo.vi}
            {/* Thông tin nhà cung cấp */}
          </CardTitle>
          <CardDescription>
            {labels.fields.organization.vi}:{" "}
            {provider.organization?.name ?? "--"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {provider.companyName && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {labels.fields.companyName.vi}
              </span>
              {/* Tên công ty */}
              <span>{provider.companyName}</span>
            </div>
          )}
          {provider.contactEmail && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span>{provider.contactEmail}</span>
            </div>
          )}
          {provider.contactPhone && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {labels.fields.contactPhone.vi}
              </span>
              {/* Điện thoại liên hệ */}
              <span>{provider.contactPhone}</span>
            </div>
          )}
          {provider.address && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {labels.fields.address.vi}
              </span>
              {/* Địa chỉ */}
              <span>{provider.address}</span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {labels.fields.createdAt.vi}
            </span>
            {/* Ngày đăng ký */}
            <span>
              {new Date(provider.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Performance metrics card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {labels.sections.performanceMetrics.vi}
            {/* Hiệu suất */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <div className="bg-muted h-24 animate-pulse rounded" />
          ) : metrics ? (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-semibold">
                  {(metrics.completionRate * 100).toFixed(0)}%
                </p>
                <p className="text-muted-foreground text-xs">
                  {labels.fields.completionRate.vi}
                  {/* Tỉ lệ hoàn thành */}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold">
                  {metrics.averageRating !== null
                    ? `${metrics.averageRating.toFixed(1)} ★`
                    : "--"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {labels.fields.averageRating.vi}
                  {/* Đánh giá trung bình */}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold">
                  {metrics.completedServices}/{metrics.totalServices}
                </p>
                <p className="text-muted-foreground text-xs">
                  {labels.fields.completedServices.vi}
                  {/* Dịch vụ đã hoàn thành */}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-red-600">
                  {metrics.disputeCount}
                </p>
                <p className="text-muted-foreground text-xs">
                  {labels.fields.disputeCount.vi}
                  {/* Số tranh chấp */}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Chưa có dữ liệu hiệu suất {/* No performance data yet */}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Service offerings card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {labels.sections.serviceOfferings.vi}
            {/* Dịch vụ cung cấp */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {provider.serviceOfferings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {labels.empty.noServiceOfferings.vi}
              {/* Chưa có dịch vụ */}
            </p>
          ) : (
            <div className="space-y-2">
              {provider.serviceOfferings.map(
                (offering: AdminServiceOffering) => (
                  <div
                    key={offering._id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium capitalize">
                      {offering.specialty.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground">
                      {offering.priceEstimate
                        ? `${offering.priceEstimate.toLocaleString("vi-VN")} VND`
                        : "--"}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {labels.sections.certifications.vi}
            {/* Chứng nhận */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {provider.certifications.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {labels.empty.noCertifications.vi}
              {/* Chưa có chứng nhận */}
            </p>
          ) : (
            <div className="space-y-3">
              {provider.certifications.map((cert: AdminCertification) => (
                <div key={cert._id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{cert.nameVi}</p>
                  {/* Vietnamese certification name (primary) */}
                  <p className="text-muted-foreground text-xs">{cert.nameEn}</p>
                  {cert.issuingBody && (
                    <p className="mt-1 text-xs">
                      Cơ quan cấp: {cert.issuingBody}
                      {/* Issuing body */}
                    </p>
                  )}
                  {cert.expiresAt && (
                    <p className="mt-1 text-xs">
                      Hết hạn:{" "}
                      {new Date(cert.expiresAt).toLocaleDateString("vi-VN")}
                      {/* Expires */}
                    </p>
                  )}
                  {cert.documentUrl && (
                    <a
                      href={cert.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary mt-1 inline-block text-xs hover:underline"
                    >
                      Xem tài liệu {/* View document */}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coverage areas card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {labels.sections.coverageAreas.vi}
            {/* Khu vực phủ sóng */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {provider.coverageAreas.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {labels.empty.noCoverageAreas.vi}
              {/* Chưa có khu vực */}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {provider.coverageAreas.map((area: AdminCoverageArea) => (
                <span
                  key={area._id}
                  className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800"
                >
                  {area.region}
                  {area.district ? ` · ${area.district}` : ""}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
