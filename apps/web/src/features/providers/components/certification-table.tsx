"use client";

/**
 * Table component for displaying provider certifications.
 *
 * WHY: Certifications are a key trust signal for hospitals. A semantic HTML
 * table provides a clear, scannable view of certification name, issuing body,
 * dates, and document links. Expiry warnings (red text within 30 days) help
 * providers renew before hospitals lose confidence.
 */

import type { Certification } from "../types";
import { providerLabels } from "../labels";

interface CertificationTableProps {
  certifications: Certification[];
  locale?: "vi" | "en";
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EXPIRY_WARNING_DAYS = 30;

/**
 * Returns true when the certification expires within 30 days from now.
 */
function isExpiringWithin30Days(expiresAt: number | undefined): boolean {
  if (expiresAt === undefined) return false;
  const daysUntilExpiry = (expiresAt - Date.now()) / MS_PER_DAY;
  return daysUntilExpiry >= 0 && daysUntilExpiry <= EXPIRY_WARNING_DAYS;
}

/**
 * Returns true when the certification has already expired.
 */
function isExpired(expiresAt: number | undefined): boolean {
  if (expiresAt === undefined) return false;
  return expiresAt < Date.now();
}

/**
 * Formats an epoch ms timestamp as a Vietnamese locale date string.
 */
function formatDate(epochMs: number | undefined): string {
  if (epochMs === undefined) return "—";
  return new Date(epochMs).toLocaleDateString("vi-VN");
}

/**
 * CertificationTable renders a semantic HTML table of provider certifications
 * with bilingual name display and expiry date warnings.
 */
export function CertificationTable({
  certifications,
  locale = "vi",
}: CertificationTableProps) {
  if (certifications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm font-medium">
          {providerLabels.certifications.noCertifications[locale]}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {providerLabels.certifications.noCertificationsDesc[locale]}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="certification-table">
        <thead>
          <tr className="border-b">
            <th className="pb-3 text-left font-medium">
              {providerLabels.certifications.nameVi[locale]}
            </th>
            <th className="pb-3 text-left font-medium">
              {providerLabels.certifications.issuingBody[locale]}
            </th>
            <th className="pb-3 text-left font-medium">
              {providerLabels.certifications.issuedDate[locale]}
            </th>
            <th className="pb-3 text-left font-medium">
              {providerLabels.certifications.expiryDate[locale]}
            </th>
            <th className="pb-3 text-left font-medium">
              {providerLabels.certifications.document[locale]}
            </th>
          </tr>
        </thead>
        <tbody>
          {certifications.map((cert) => {
            const expired = isExpired(cert.expiresAt);
            const expiringSoon =
              !expired && isExpiringWithin30Days(cert.expiresAt);

            return (
              <tr
                key={cert._id}
                className="border-b last:border-0"
                data-testid="certification-row"
              >
                <td className="py-3 pr-4">
                  <div>
                    <p className="font-medium">{cert.nameVi}</p>
                    {cert.nameEn && (
                      <p className="text-muted-foreground text-xs">
                        {cert.nameEn}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {cert.issuingBody ?? "—"}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {formatDate(cert.issuedAt)}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      expired
                        ? "font-medium text-destructive"
                        : expiringSoon
                          ? "font-medium text-orange-600"
                          : "text-muted-foreground"
                    }
                    data-testid={
                      expired
                        ? "cert-expired"
                        : expiringSoon
                          ? "cert-expiring-soon"
                          : undefined
                    }
                  >
                    {formatDate(cert.expiresAt)}
                    {expiringSoon && (
                      <span className="ml-1 text-xs">
                        ({providerLabels.certifications.expiryWarning[locale]})
                      </span>
                    )}
                    {expired && (
                      <span className="ml-1 text-xs">
                        ({providerLabels.certifications.expired[locale]})
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-3">
                  {cert.documentUrl ? (
                    <a
                      href={cert.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {providerLabels.certifications.viewDocument[locale]}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
