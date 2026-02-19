/**
 * Tests for CertificationTable component.
 *
 * WHY: Verifies bilingual name rendering, date formatting, expiry warning
 * for near-expiry certifications, and correct empty state.
 */
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "~/test-utils";
import { CertificationTable } from "../certification-table";
import type { Certification } from "../../types";

const now = Date.now();
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const makeCert = (
  id: string,
  overrides?: Partial<Certification>,
): Certification => ({
  _id: id,
  _creationTime: now,
  providerId: "prov_001",
  nameVi: "Chứng nhận ISO 13485",
  nameEn: "ISO 13485 Certification",
  issuingBody: "ISO",
  issuedAt: now - 365 * MS_PER_DAY,
  expiresAt: now + 365 * MS_PER_DAY,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe("CertificationTable", () => {
  it("test_CertificationTable_rendersVietnameseName", () => {
    renderWithProviders(
      <CertificationTable
        certifications={[makeCert("cert_001")]}
        locale="vi"
      />,
    );

    expect(screen.getByText("Chứng nhận ISO 13485")).toBeInTheDocument();
  });

  it("test_CertificationTable_rendersEnglishName", () => {
    renderWithProviders(
      <CertificationTable
        certifications={[makeCert("cert_001")]}
        locale="vi"
      />,
    );

    // English name appears as secondary line
    expect(screen.getByText("ISO 13485 Certification")).toBeInTheDocument();
  });

  it("test_CertificationTable_rendersIssuingBody", () => {
    renderWithProviders(
      <CertificationTable
        certifications={[makeCert("cert_001")]}
        locale="vi"
      />,
    );

    expect(screen.getByText("ISO")).toBeInTheDocument();
  });

  it("test_CertificationTable_showsExpiryWarningForNearExpiry", () => {
    const expiringCert = makeCert("cert_exp", {
      // Expires in 10 days — within 30 day warning threshold
      expiresAt: now + 10 * MS_PER_DAY,
    });

    renderWithProviders(
      <CertificationTable
        certifications={[expiringCert]}
        locale="vi"
      />,
    );

    expect(screen.getByTestId("cert-expiring-soon")).toBeInTheDocument();
    expect(screen.getByText(/Sắp hết hạn/)).toBeInTheDocument();
  });

  it("test_CertificationTable_showsExpiredForPastDate", () => {
    const expiredCert = makeCert("cert_old", {
      expiresAt: now - 10 * MS_PER_DAY,
    });

    renderWithProviders(
      <CertificationTable
        certifications={[expiredCert]}
        locale="vi"
      />,
    );

    expect(screen.getByTestId("cert-expired")).toBeInTheDocument();
    expect(screen.getByText(/Đã hết hạn/)).toBeInTheDocument();
  });

  it("test_CertificationTable_showsEmptyState", () => {
    renderWithProviders(
      <CertificationTable certifications={[]} locale="vi" />,
    );

    expect(screen.getByText("Chưa có chứng nhận nào")).toBeInTheDocument();
  });

  it("test_CertificationTable_rendersMultipleRows", () => {
    renderWithProviders(
      <CertificationTable
        certifications={[
          makeCert("cert_001"),
          makeCert("cert_002", {
            nameVi: "Chứng nhận CE",
            nameEn: "CE Mark",
          }),
        ]}
        locale="vi"
      />,
    );

    const rows = screen.getAllByTestId("certification-row");
    expect(rows).toHaveLength(2);
  });
});
