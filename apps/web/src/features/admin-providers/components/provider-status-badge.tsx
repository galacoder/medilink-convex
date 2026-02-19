"use client";

import { Badge } from "@medilink/ui/badge";

import type { ProviderStatus, VerificationStatus } from "../types";

/**
 * Status badge variants for provider status.
 * vi: "Huy hiệu trạng thái nhà cung cấp" / en: "Provider status badge"
 */
const PROVIDER_STATUS_VARIANTS: Record<
  ProviderStatus,
  { label: { vi: string; en: string }; className: string }
> = {
  active: {
    label: { vi: "Hoạt động", en: "Active" },
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  },
  inactive: {
    label: { vi: "Không hoạt động", en: "Inactive" },
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
  },
  suspended: {
    label: { vi: "Bị đình chỉ", en: "Suspended" },
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
  pending_verification: {
    label: { vi: "Chờ xác minh", en: "Pending" },
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  },
};

/**
 * Verification status badge variants.
 * vi: "Huy hiệu trạng thái xác minh" / en: "Verification status badge"
 */
const VERIFICATION_STATUS_VARIANTS: Record<
  VerificationStatus,
  { label: { vi: string; en: string }; className: string }
> = {
  pending: {
    label: { vi: "Đang chờ", en: "Pending" },
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  },
  in_review: {
    label: { vi: "Đang xem xét", en: "In Review" },
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  },
  verified: {
    label: { vi: "Đã xác minh", en: "Verified" },
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  },
  rejected: {
    label: { vi: "Bị từ chối", en: "Rejected" },
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
};

interface ProviderStatusBadgeProps {
  status: ProviderStatus;
}

/**
 * Badge showing provider operational status.
 * vi: "Huy hiệu trạng thái hoạt động" / en: "Provider operational status badge"
 */
export function ProviderStatusBadge({ status }: ProviderStatusBadgeProps) {
  const variant = PROVIDER_STATUS_VARIANTS[status];

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label.vi} {/* Vietnamese primary */}
    </Badge>
  );
}

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
}

/**
 * Badge showing provider verification status.
 * vi: "Huy hiệu trạng thái xác minh" / en: "Provider verification status badge"
 */
export function VerificationStatusBadge({
  status,
}: VerificationStatusBadgeProps) {
  const variant = VERIFICATION_STATUS_VARIANTS[status];

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label.vi} {/* Vietnamese primary */}
    </Badge>
  );
}
