/**
 * Seed data constants for provider analytics enrichment.
 * vi: "Dữ liệu mẫu làm giàu phân tích nhà cung cấp"
 * en: "Seed data for provider analytics enrichment"
 *
 * Tables populated:
 *   - serviceRatings      (3 ratings for the completed service request)
 *   - completionReports   (2 completion reports for completed requests)
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1700000000000; // Fixed reference timestamp for reproducible seeds (~Nov 2023)

// ---------------------------------------------------------------------------
// Service ratings
// serviceRequestKey matches requestKeyToIndex in seed.ts:
//   REQUEST_PENDING=0, REQUEST_QUOTED=1, REQUEST_ACCEPTED=2,
//   REQUEST_IN_PROGRESS=3, REQUEST_COMPLETED=4, REQUEST_DISPUTED=5
// ratedByKey matches keys in userKeyMap: hospital_owner, hospital_staff_1, hospital_staff_2
// ---------------------------------------------------------------------------

interface SeedServiceRating {
  serviceRequestKey: "REQUEST_COMPLETED";
  ratedByKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  rating: number;
  commentVi: string;
  commentEn: string;
  serviceQuality: number;
  timeliness: number;
  professionalism: number;
  daysAgo: number;
}

export const SEED_SERVICE_RATINGS: SeedServiceRating[] = [
  {
    serviceRequestKey: "REQUEST_COMPLETED",
    ratedByKey: "hospital_owner",
    rating: 5,
    commentVi:
      "Kỹ thuật viên TechMed đã thực hiện bảo trì máy sốc điện tim rất chuyên nghiệp. Thiết bị hoạt động hoàn hảo sau bảo trì.",
    commentEn:
      "TechMed technician performed defibrillator maintenance very professionally. Equipment works perfectly after maintenance.",
    serviceQuality: 5,
    timeliness: 5,
    professionalism: 5,
    daysAgo: 6,
  },
  {
    serviceRequestKey: "REQUEST_COMPLETED",
    ratedByKey: "hospital_staff_1",
    rating: 4,
    commentVi:
      "Bảo trì được thực hiện đúng hạn và chất lượng tốt. Kỹ thuật viên giải thích rõ ràng các bước thực hiện.",
    commentEn:
      "Maintenance performed on time and with good quality. Technician explained the steps clearly.",
    serviceQuality: 4,
    timeliness: 4,
    professionalism: 5,
    daysAgo: 6,
  },
  {
    serviceRequestKey: "REQUEST_COMPLETED",
    ratedByKey: "hospital_staff_2",
    rating: 5,
    commentVi:
      "Rất hài lòng với dịch vụ. Kỹ thuật viên đến đúng giờ, làm việc nhanh chóng và hiệu quả.",
    commentEn:
      "Very satisfied with the service. Technician arrived on time, worked quickly and efficiently.",
    serviceQuality: 5,
    timeliness: 5,
    professionalism: 4,
    daysAgo: 7,
  },
];

// ---------------------------------------------------------------------------
// Completion reports
// serviceRequestKey matches requestKeyToIndex
// submittedByKey matches userKeyMap keys
// ---------------------------------------------------------------------------

interface SeedCompletionReport {
  serviceRequestKey: "REQUEST_COMPLETED";
  submittedByKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  workDescriptionVi: string;
  workDescriptionEn: string;
  partsReplaced: string[];
  nextMaintenanceRecommendation: string;
  actualHours: number;
  photoUrls: string[];
  daysAgo: number;
}

export const SEED_COMPLETION_REPORTS: SeedCompletionReport[] = [
  {
    serviceRequestKey: "REQUEST_COMPLETED",
    submittedByKey: "hospital_staff_1",
    workDescriptionVi:
      "Đã thực hiện bảo trì định kỳ máy sốc điện tim ZOLL R Series. Kiểm tra toàn bộ hệ thống điện, thay pin chính và pin dự phòng, hiệu chỉnh mức năng lượng sốc điện, kiểm tra điện cực và cáp kết nối. Thiết bị đã được vệ sinh sạch sẽ và kiểm tra an toàn theo tiêu chuẩn IEC 60601.",
    workDescriptionEn:
      "Performed periodic maintenance on ZOLL R Series defibrillator. Checked entire electrical system, replaced main and backup batteries, calibrated shock energy levels, inspected electrodes and connecting cables. Device was thoroughly cleaned and safety-tested per IEC 60601 standards.",
    partsReplaced: [
      "Pin chính ZOLL R Series 3.0Ah / ZOLL R Series Main Battery 3.0Ah",
      "Pin dự phòng NiMH 9V / NiMH 9V Backup Battery",
      "Điện cực dán AED (1 cặp) / AED Adhesive Electrodes (1 pair)",
    ],
    nextMaintenanceRecommendation:
      "Bảo trì định kỳ tiếp theo: sau 6 tháng hoặc khi đèn báo pin nhấp nháy. Kiểm tra điện cực hàng tháng. / Next maintenance: 6 months from now or when battery indicator flashes. Monthly electrode inspection recommended.",
    actualHours: 3.5,
    photoUrls: [
      "https://storage.medilink.vn/reports/defibrillator-maint-before.jpg",
      "https://storage.medilink.vn/reports/defibrillator-maint-after.jpg",
      "https://storage.medilink.vn/reports/defibrillator-battery-replace.jpg",
    ],
    daysAgo: 7,
  },
];

// ---------------------------------------------------------------------------
// Extra service offerings (3 additional specialties to enrich provider profile)
// ---------------------------------------------------------------------------

interface SeedExtraOffering {
  specialty:
    | "electrical"
    | "software"
    | "diagnostics"
    | "training"
    | "installation"
    | "other";
  descriptionVi: string;
  descriptionEn: string;
  priceEstimate: number;
  turnaroundDays: number;
}

export const SEED_EXTRA_OFFERINGS: SeedExtraOffering[] = [
  {
    specialty: "electrical",
    descriptionVi:
      "Kiểm tra và sửa chữa hệ thống điện trong thiết bị y tế, bao gồm nguồn cung cấp điện, bo mạch và hệ thống cảnh báo",
    descriptionEn:
      "Inspection and repair of electrical systems in medical equipment, including power supplies, circuit boards, and alarm systems",
    priceEstimate: 1800000,
    turnaroundDays: 4,
  },
  {
    specialty: "software",
    descriptionVi:
      "Cập nhật phần mềm, cấu hình và khắc phục sự cố phần mềm cho thiết bị y tế kỹ thuật số",
    descriptionEn:
      "Software updates, configuration, and troubleshooting for digital medical equipment",
    priceEstimate: 600000,
    turnaroundDays: 1,
  },
  {
    specialty: "installation",
    descriptionVi:
      "Lắp đặt và commissioning thiết bị y tế mới, bao gồm kiểm tra an toàn và đào tạo người dùng ban đầu",
    descriptionEn:
      "Installation and commissioning of new medical equipment, including safety testing and initial user training",
    priceEstimate: 3200000,
    turnaroundDays: 2,
  },
];

// ---------------------------------------------------------------------------
// Extra certifications (1 expiring-soon cert)
// ---------------------------------------------------------------------------

interface SeedExtraCertification {
  nameVi: string;
  nameEn: string;
  issuingBody: string;
  issuedAt: number;
  expiresAt: number;
  documentUrl: string;
}

export const SEED_EXTRA_CERTIFICATIONS: SeedExtraCertification[] = [
  {
    nameVi:
      "Chứng chỉ Kỹ thuật viên Thiết bị Y tế Cấp cao (CBET) — AAMI Việt Nam",
    nameEn:
      "Certified Biomedical Equipment Technician (CBET) — AAMI Vietnam Chapter",
    issuingBody: "AAMI Vietnam Chapter",
    issuedAt: NOW - 2 * 365 * ONE_DAY_MS,
    expiresAt: NOW + 45 * ONE_DAY_MS, // Expires soon (within 2 months — triggers expiry warning)
    documentUrl: "https://storage.techmed.vn/certs/cbet-aami-vn.pdf",
  },
];

// ---------------------------------------------------------------------------
// Extra coverage areas (2 additional provinces)
// ---------------------------------------------------------------------------

interface SeedExtraCoverageArea {
  region: string;
  district: string;
  isActive: boolean;
}

export const SEED_EXTRA_COVERAGE_AREAS: SeedExtraCoverageArea[] = [
  {
    region: "Đồng Nai",
    district: "Biên Hòa, Long Thành, Nhơn Trạch",
    isActive: true,
  },
  {
    region: "Long An",
    district: "Tân An, Bến Lức, Đức Hòa",
    isActive: true,
  },
];
