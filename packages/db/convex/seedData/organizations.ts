/**
 * Seed data: Organizations
 * vi: "Dữ liệu mẫu: Tổ chức" / en: "Seed data: Organizations"
 *
 * 2 organizations:
 *   - SPMET Healthcare School (hospital)
 *   - TechMed Services (provider)
 */

export interface SeedOrganization {
  name: string;
  slug: string;
  org_type: "hospital" | "provider";
}

// vi: "Trường Y tế SPMET" / en: "SPMET Healthcare School"
export const SPMET_HOSPITAL: SeedOrganization = {
  name: "SPMET Healthcare School",
  slug: "spmet-hospital",
  org_type: "hospital",
};

// vi: "Dịch vụ TechMed" / en: "TechMed Services"
export const TECHMED_PROVIDER: SeedOrganization = {
  name: "TechMed Services",
  slug: "techmed-services",
  org_type: "provider",
};

export const ALL_SEED_ORGANIZATIONS: SeedOrganization[] = [
  SPMET_HOSPITAL,
  TECHMED_PROVIDER,
];
