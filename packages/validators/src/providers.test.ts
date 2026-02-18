import { describe, expect, it } from "vitest";

import {
  createCertificationSchema,
  createCoverageAreaSchema,
  createProviderSchema,
  createServiceOfferingSchema,
  providerStatusSchema,
  providerVerificationStatusSchema,
  serviceSpecialtySchema,
  updateProviderSchema,
} from "./providers";

// ---------------------------------------------------------------------------
// providerStatusSchema
// ---------------------------------------------------------------------------
describe("providerStatusSchema", () => {
  it("test_providerStatusSchema_accepts_active_inactive_suspended", () => {
    const valid = [
      "active",
      "inactive",
      "suspended",
      "pending_verification",
    ] as const;
    for (const status of valid) {
      expect(providerStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("test_providerStatusSchema_rejects_invalid_status", () => {
    expect(providerStatusSchema.safeParse("banned").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// providerVerificationStatusSchema
// ---------------------------------------------------------------------------
describe("providerVerificationStatusSchema", () => {
  it("test_providerVerificationStatusSchema_accepts_all_values", () => {
    const valid = ["pending", "in_review", "verified", "rejected"] as const;
    for (const status of valid) {
      expect(providerVerificationStatusSchema.safeParse(status).success).toBe(
        true,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// serviceSpecialtySchema
// ---------------------------------------------------------------------------
describe("serviceSpecialtySchema", () => {
  it("test_serviceSpecialtySchema_accepts_all_9_values", () => {
    const valid = [
      "general_repair",
      "calibration",
      "installation",
      "preventive_maint",
      "electrical",
      "software",
      "diagnostics",
      "training",
      "other",
    ] as const;
    expect(valid).toHaveLength(9);
    for (const specialty of valid) {
      expect(serviceSpecialtySchema.safeParse(specialty).success).toBe(true);
    }
  });

  it("test_serviceSpecialtySchema_rejects_invalid_specialty", () => {
    expect(serviceSpecialtySchema.safeParse("plumbing").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createProviderSchema
// ---------------------------------------------------------------------------
describe("createProviderSchema", () => {
  const validProvider = {
    organizationId: "org_123",
    nameVi: "Công ty Kỹ thuật Y tế Việt Nam",
    nameEn: "Vietnam Medical Engineering Co.",
    status: "active" as const,
    verificationStatus: "pending" as const,
  };

  it("test_createProviderSchema_accepts_valid_input", () => {
    const result = createProviderSchema.safeParse(validProvider);
    expect(result.success).toBe(true);
  });

  it("test_createProviderSchema_accepts_full_input", () => {
    const result = createProviderSchema.safeParse({
      ...validProvider,
      companyName: "VN Medical Engineering JSC",
      descriptionVi: "Chuyên cung cấp dịch vụ sửa chữa thiết bị y tế",
      descriptionEn: "Specializes in medical equipment repair services",
      contactEmail: "info@vnmedeng.vn",
      contactPhone: "+84-28-1234-5678",
      address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      userId: "user_101",
    });
    expect(result.success).toBe(true);
  });

  it("test_createProviderSchema_rejects_short_nameVi", () => {
    const result = createProviderSchema.safeParse({
      ...validProvider,
      nameVi: "A",
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Tên nhà cung cấp");
  });

  it("test_createProviderSchema_rejects_invalid_email", () => {
    const result = createProviderSchema.safeParse({
      ...validProvider,
      contactEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Email không hợp lệ");
  });

  it("test_createProviderSchema_accepts_valid_email", () => {
    const result = createProviderSchema.safeParse({
      ...validProvider,
      contactEmail: "contact@provider.com.vn",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateProviderSchema
// ---------------------------------------------------------------------------
describe("updateProviderSchema", () => {
  it("test_updateProviderSchema_accepts_partial_input", () => {
    const result = updateProviderSchema.safeParse({
      status: "active" as const,
      verificationStatus: "verified" as const,
    });
    expect(result.success).toBe(true);
  });

  it("test_updateProviderSchema_accepts_empty_object", () => {
    expect(updateProviderSchema.safeParse({}).success).toBe(true);
  });

  it("test_updateProviderSchema_rejects_invalid_status", () => {
    const result = updateProviderSchema.safeParse({
      status: "approved", // not a valid enum value
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createServiceOfferingSchema
// ---------------------------------------------------------------------------
describe("createServiceOfferingSchema", () => {
  const validOffering = {
    providerId: "prov_123",
    specialty: "calibration" as const,
  };

  it("test_createServiceOfferingSchema_accepts_valid_input", () => {
    expect(createServiceOfferingSchema.safeParse(validOffering).success).toBe(
      true,
    );
  });

  it("test_createServiceOfferingSchema_rejects_negative_price", () => {
    const result = createServiceOfferingSchema.safeParse({
      ...validOffering,
      priceEstimate: -100,
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("Giá ước tính không được âm");
  });
});

// ---------------------------------------------------------------------------
// createCertificationSchema
// ---------------------------------------------------------------------------
describe("createCertificationSchema", () => {
  const validCert = {
    providerId: "prov_123",
    nameVi: "Chứng nhận ISO 13485",
    nameEn: "ISO 13485 Certification",
  };

  it("test_createCertificationSchema_accepts_valid_input", () => {
    expect(createCertificationSchema.safeParse(validCert).success).toBe(true);
  });

  it("test_createCertificationSchema_rejects_invalid_document_url", () => {
    const result = createCertificationSchema.safeParse({
      ...validCert,
      documentUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
    const message = result.error?.issues[0]?.message ?? "";
    expect(message).toContain("URL tài liệu không hợp lệ");
  });

  it("test_createCertificationSchema_accepts_valid_url", () => {
    const result = createCertificationSchema.safeParse({
      ...validCert,
      documentUrl: "https://storage.medilink.vn/certs/iso13485.pdf",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createCoverageAreaSchema
// ---------------------------------------------------------------------------
describe("createCoverageAreaSchema", () => {
  it("test_createCoverageAreaSchema_accepts_valid_input", () => {
    const result = createCoverageAreaSchema.safeParse({
      providerId: "prov_123",
      region: "TP. Hồ Chí Minh",
      district: "Quận 1",
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("test_createCoverageAreaSchema_rejects_missing_region", () => {
    const result = createCoverageAreaSchema.safeParse({
      providerId: "prov_123",
      isActive: true,
    });
    expect(result.success).toBe(false);
  });
});
