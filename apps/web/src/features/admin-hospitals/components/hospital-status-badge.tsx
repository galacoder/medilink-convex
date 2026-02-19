"use client";

/**
 * Status badge for hospital organizations.
 *
 * WHY: Consistent visual representation of hospital status across
 * the hospital list table and detail page. Bilingual label support.
 *
 * vi: "Huy hiệu trạng thái bệnh viện" / en: "Hospital status badge"
 */
import type { HospitalStatus } from "../types";
import { adminHospitalLabels } from "../labels";

interface HospitalStatusBadgeProps {
  status: HospitalStatus;
  locale?: "vi" | "en";
}

const statusStyles: Record<HospitalStatus, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  trial: "bg-yellow-100 text-yellow-800",
};

/**
 * Inline badge showing hospital status with bilingual label.
 *
 * vi: "Hiển thị trạng thái bệnh viện" / en: "Display hospital status"
 */
export function HospitalStatusBadge({
  status,
  locale = "vi",
}: HospitalStatusBadgeProps) {
  const label = adminHospitalLabels.statuses[status][locale];
  const className = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
