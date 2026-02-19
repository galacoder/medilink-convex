"use client";

/**
 * Hospital list table for the platform admin portal.
 *
 * WHY: Displays all hospital organizations with key metrics in a
 * searchable, filterable, paginated table. Actions (view detail,
 * suspend, reactivate) are inline.
 *
 * vi: "Bảng danh sách bệnh viện" / en: "Hospital list table"
 */
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";

import type { HospitalSummary } from "../types";
import { adminHospitalLabels } from "../labels";
import { HospitalStatusBadge } from "./hospital-status-badge";

interface HospitalTableProps {
  hospitals: HospitalSummary[];
  isLoading?: boolean;
  locale?: "vi" | "en";
}

/**
 * Renders a table of hospital orgs with name, status, member/equipment counts,
 * and a link to the detail page.
 *
 * vi: "Bảng danh sách bệnh viện" / en: "Hospital list table"
 */
export function HospitalTable({
  hospitals,
  isLoading = false,
  locale = "vi",
}: HospitalTableProps) {
  const L = adminHospitalLabels;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-muted h-12 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">
          {L.empty.noHospitals[locale]}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {L.empty.noHospitalsDesc[locale]}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{L.fields.name[locale]}</TableHead>
          <TableHead>{L.fields.status[locale]}</TableHead>
          <TableHead className="text-right">
            {L.fields.memberCount[locale]}
          </TableHead>
          <TableHead className="text-right">
            {L.fields.equipmentCount[locale]}
          </TableHead>
          <TableHead>{L.fields.createdAt[locale]}</TableHead>
          <TableHead>{/* Actions */}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hospitals.map((hospital) => (
          <TableRow key={hospital._id}>
            <TableCell className="font-medium">
              <div>
                <span>{hospital.name}</span>
                <p className="text-muted-foreground text-xs">{hospital.slug}</p>
              </div>
            </TableCell>
            <TableCell>
              <HospitalStatusBadge status={hospital.status} locale={locale} />
            </TableCell>
            <TableCell className="text-right">{hospital.memberCount}</TableCell>
            <TableCell className="text-right">
              {hospital.equipmentCount}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(hospital.createdAt).toLocaleDateString(
                locale === "vi" ? "vi-VN" : "en-US",
              )}
            </TableCell>
            <TableCell>
              <Link
                href={`/admin/hospitals/${hospital._id}`}
                className="text-primary text-sm hover:underline"
              >
                {L.actions.viewDetail[locale]}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
