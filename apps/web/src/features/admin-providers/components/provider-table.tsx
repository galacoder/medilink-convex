"use client";

import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@medilink/ui/table";

import type { AdminProviderListItem } from "../types";
import { adminProviderLabels } from "../labels";
import {
  ProviderStatusBadge,
  VerificationStatusBadge,
} from "./provider-status-badge";

interface ProviderTableProps {
  providers: AdminProviderListItem[];
  isLoading: boolean;
}

/**
 * Table component for the admin provider list.
 *
 * WHY: Tabular view allows platform admins to quickly scan provider status,
 * verification state, and registration date across multiple providers at once.
 *
 * vi: "Bảng danh sách nhà cung cấp" / en: "Admin provider list table"
 */
export function ProviderTable({ providers, isLoading }: ProviderTableProps) {
  const labels = adminProviderLabels;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-muted h-12 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        <p className="text-sm font-medium">{labels.empty.noProviders.vi}</p>
        {/* No providers yet */}
        <p className="mt-1 text-xs">{labels.empty.noProvidersDesc.vi}</p>
        {/* Registered providers will appear here */}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labels.fields.name.vi}</TableHead>
          {/* Provider Name */}
          <TableHead>{labels.fields.organization.vi}</TableHead>
          {/* Organization */}
          <TableHead>{labels.fields.status.vi}</TableHead>
          {/* Status */}
          <TableHead>{labels.fields.verificationStatus.vi}</TableHead>
          {/* Verification Status */}
          <TableHead>{labels.fields.averageRating.vi}</TableHead>
          {/* Average Rating */}
          <TableHead>{labels.fields.createdAt.vi}</TableHead>
          {/* Registration Date */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {providers.map((provider) => (
          <TableRow
            key={provider._id}
            className="hover:bg-muted/50 cursor-pointer"
          >
            <TableCell>
              <Link
                href={`/admin/providers/${provider._id}`}
                className="hover:text-primary font-medium hover:underline"
              >
                {provider.nameVi}
                {/* Vietnamese name (primary) */}
              </Link>
              {provider.companyName && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {provider.companyName}
                </p>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {provider.organizationName ?? "--"}
            </TableCell>
            <TableCell>
              <ProviderStatusBadge status={provider.status} />
            </TableCell>
            <TableCell>
              <VerificationStatusBadge status={provider.verificationStatus} />
            </TableCell>
            <TableCell className="text-sm">
              {provider.averageRating
                ? `${provider.averageRating.toFixed(1)} ★`
                : "--"}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(provider.createdAt).toLocaleDateString("vi-VN")}
              {/* Vietnamese date format */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
