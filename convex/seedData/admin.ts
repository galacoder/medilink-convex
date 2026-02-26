/**
 * Seed data constants for admin portal tables.
 * vi: "Dữ liệu mẫu cho trang quản trị" / en: "Seed data for admin portal tables"
 *
 * Covers:
 *   - auditLog: 22 entries across equipment, serviceRequests, disputes, quotes domains
 *   - automationLog: 18 entries for cron dashboard (all 5 rule names, mix of success/error)
 *   - Extra hospital orgs (trial, suspended) for admin org management page variety
 *   - Extra provider org (pending_verification/inactive) for provider list variety
 */

// ---------------------------------------------------------------------------
// Audit Log seed entries
// ---------------------------------------------------------------------------

/**
 * Template for auditLog entries.
 * Actual IDs (organizationId, actorId, resourceId) are resolved at seed time.
 * `orgKey` and `actorKey` are placeholders mapped to IDs in the mutation.
 *
 * action examples follow Convex naming: "domain.entity.verb"
 */
export interface AuditLogTemplate {
  action: string;
  resourceType: string;
  resourceIdPlaceholder: string; // placeholder string written as resourceId
  previousValues?: Record<string, unknown> | undefined;
  newValues?: Record<string, unknown> | undefined;
  ipAddress?: string;
  /** Offset in days before now for createdAt (0 = today, 30 = 30 days ago) */
  daysAgo: number;
  /** "admin" | "hospital_owner" — determines actorKey */
  actorKey: "admin" | "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  /** "hospital" | "provider" — determines orgKey */
  orgKey: "hospital" | "provider";
}

export const SEED_AUDIT_LOG_ENTRIES: AuditLogTemplate[] = [
  // Equipment domain (6 entries)
  {
    action: "equipment.status_changed",
    resourceType: "equipment",
    resourceIdPlaceholder: "EQ-ULTRASOUND-001",
    previousValues: { status: "available" },
    newValues: { status: "in_use" },
    ipAddress: "192.168.1.10",
    daysAgo: 28,
    actorKey: "hospital_owner",
    orgKey: "hospital",
  },
  {
    action: "equipment.status_changed",
    resourceType: "equipment",
    resourceIdPlaceholder: "EQ-ECG-001",
    previousValues: { status: "in_use" },
    newValues: { status: "maintenance" },
    ipAddress: "192.168.1.11",
    daysAgo: 21,
    actorKey: "hospital_staff_1",
    orgKey: "hospital",
  },
  {
    action: "equipment.maintenance_scheduled",
    resourceType: "equipment",
    resourceIdPlaceholder: "EQ-XRAY-001",

    newValues: {
      type: "preventive",
      scheduledAt: "2026-02-15",
      technicianId: "hospital_staff_1",
    },
    ipAddress: "192.168.1.10",
    daysAgo: 18,
    actorKey: "hospital_owner",
    orgKey: "hospital",
  },
  {
    action: "equipment.created",
    resourceType: "equipment",
    resourceIdPlaceholder: "EQ-VENTILATOR-001",
    newValues: {
      nameEn: "Ventilator",
      status: "available",
      condition: "excellent",
      criticality: "A",
    },
    ipAddress: "192.168.1.10",
    daysAgo: 45,
    actorKey: "hospital_owner",
    orgKey: "hospital",
  },
  {
    action: "equipment.condition_updated",
    resourceType: "equipment",
    resourceIdPlaceholder: "EQ-DEFIBRILLATOR-001",
    previousValues: { condition: "good" },
    newValues: { condition: "fair" },
    ipAddress: "192.168.1.12",
    daysAgo: 10,
    actorKey: "hospital_staff_2",
    orgKey: "hospital",
  },
  {
    action: "equipment.failure_reported",
    resourceType: "equipment",
    resourceIdPlaceholder: "EQ-PATIENT-MONITOR-001",
    previousValues: { status: "in_use" },
    newValues: { status: "damaged", urgency: "high" },
    ipAddress: "192.168.1.11",
    daysAgo: 7,
    actorKey: "hospital_staff_1",
    orgKey: "hospital",
  },

  // Service Requests domain (6 entries)
  {
    action: "serviceRequest.created",
    resourceType: "serviceRequests",
    resourceIdPlaceholder: "SR-REPAIR-ULTRASOUND",

    newValues: {
      type: "repair",
      status: "pending",
      priority: "high",
    },
    ipAddress: "192.168.1.10",
    daysAgo: 25,
    actorKey: "hospital_owner",
    orgKey: "hospital",
  },
  {
    action: "serviceRequest.status_changed",
    resourceType: "serviceRequests",
    resourceIdPlaceholder: "SR-REPAIR-ULTRASOUND",
    previousValues: { status: "pending" },
    newValues: { status: "quoted" },
    ipAddress: "10.0.0.5",
    daysAgo: 22,
    actorKey: "admin",
    orgKey: "hospital",
  },
  {
    action: "serviceRequest.quote_accepted",
    resourceType: "serviceRequests",
    resourceIdPlaceholder: "SR-CALIBRATION-ECG",
    previousValues: { quoteStatus: "pending" },
    newValues: { quoteStatus: "accepted", amount: 2500000, currency: "VND" },
    ipAddress: "192.168.1.10",
    daysAgo: 15,
    actorKey: "hospital_owner",
    orgKey: "hospital",
  },
  {
    action: "serviceRequest.completed",
    resourceType: "serviceRequests",
    resourceIdPlaceholder: "SR-MAINT-AUTOCLAVE",
    previousValues: { status: "in_progress" },
    newValues: { status: "completed", completedAt: "2026-02-10" },
    ipAddress: "10.0.0.5",
    daysAgo: 14,
    actorKey: "admin",
    orgKey: "hospital",
  },
  {
    action: "serviceRequest.disputed",
    resourceType: "serviceRequests",
    resourceIdPlaceholder: "SR-REPAIR-MONITOR",
    previousValues: { status: "completed" },
    newValues: { status: "disputed", disputeType: "quality" },
    ipAddress: "192.168.1.10",
    daysAgo: 8,
    actorKey: "hospital_owner",
    orgKey: "hospital",
  },
  {
    action: "admin.serviceRequest.providerReassigned",
    resourceType: "serviceRequests",
    resourceIdPlaceholder: "SR-INSTALL-DEFIBRILLATOR",
    previousValues: { assignedProviderId: "techmed-services" },
    newValues: {
      newProviderId: "vietmed-services",
      reasonVi: "Nhà cung cấp không đáp ứng được thời hạn",
      reasonEn: "Provider failed to meet deadline",
    },
    ipAddress: "10.0.0.1",
    daysAgo: 5,
    actorKey: "admin",
    orgKey: "hospital",
  },

  // Disputes domain (4 entries)
  {
    action: "dispute.created",
    resourceType: "disputes",
    resourceIdPlaceholder: "DISPUTE-QUALITY-001",

    newValues: {
      status: "open",
      type: "quality",
      descriptionVi: "Thiết bị vẫn gặp sự cố sau sửa chữa",
    },
    ipAddress: "192.168.1.10",
    daysAgo: 12,
    actorKey: "hospital_owner",
    orgKey: "hospital",
  },
  {
    action: "dispute.status_changed",
    resourceType: "disputes",
    resourceIdPlaceholder: "DISPUTE-QUALITY-001",
    previousValues: { status: "open" },
    newValues: { status: "investigating" },
    ipAddress: "10.0.0.1",
    daysAgo: 9,
    actorKey: "admin",
    orgKey: "hospital",
  },
  {
    action: "dispute.escalated",
    resourceType: "disputes",
    resourceIdPlaceholder: "DISPUTE-PRICING-001",
    previousValues: { status: "investigating" },
    newValues: { status: "escalated" },
    ipAddress: "10.0.0.1",
    daysAgo: 3,
    actorKey: "admin",
    orgKey: "hospital",
  },
  {
    action: "admin.dispute.arbitrated",
    resourceType: "disputes",
    resourceIdPlaceholder: "DISPUTE-TIMELINE-001",
    previousValues: { status: "escalated" },
    newValues: {
      status: "resolved",
      resolution: "partial_refund",
      refundAmount: 1500000,
    },
    ipAddress: "10.0.0.1",
    daysAgo: 1,
    actorKey: "admin",
    orgKey: "hospital",
  },

  // Quotes domain (3 entries)
  {
    action: "quote.submitted",
    resourceType: "quotes",
    resourceIdPlaceholder: "QUOTE-001",

    newValues: {
      amount: 3500000,
      currency: "VND",
      estimatedDurationDays: 3,
    },
    ipAddress: "10.0.0.5",
    daysAgo: 20,
    actorKey: "admin",
    orgKey: "provider",
  },
  {
    action: "quote.rejected",
    resourceType: "quotes",
    resourceIdPlaceholder: "QUOTE-002",
    previousValues: { status: "pending" },
    newValues: { status: "rejected", reason: "Giá quá cao / Price too high" },
    ipAddress: "192.168.1.10",
    daysAgo: 17,
    actorKey: "hospital_owner",
    orgKey: "hospital",
  },
  {
    action: "quote.expired",
    resourceType: "quotes",
    resourceIdPlaceholder: "QUOTE-003",
    previousValues: { status: "pending" },
    newValues: { status: "expired" },
    ipAddress: "10.0.0.1",
    daysAgo: 2,
    actorKey: "admin",
    orgKey: "provider",
  },

  // User / org admin actions (3 entries)
  {
    action: "user.role_changed",
    resourceType: "users",
    resourceIdPlaceholder: "USER-DUC-PHAM",
    previousValues: { role: "member" },
    newValues: { role: "admin" },
    ipAddress: "10.0.0.1",
    daysAgo: 60,
    actorKey: "admin",
    orgKey: "hospital",
  },
  {
    action: "org.status_changed",
    resourceType: "organizations",
    resourceIdPlaceholder: "ORG-BACH-MAI",
    previousValues: { status: "trial" },
    newValues: { status: "active" },
    ipAddress: "10.0.0.1",
    daysAgo: 30,
    actorKey: "admin",
    orgKey: "hospital",
  },
  {
    action: "org.suspended",
    resourceType: "organizations",
    resourceIdPlaceholder: "ORG-CHO-RAY",
    previousValues: { status: "active" },
    newValues: {
      status: "suspended",
      reason: "Chưa thanh toán phí dịch vụ / Outstanding service fees",
    },
    ipAddress: "10.0.0.1",
    daysAgo: 15,
    actorKey: "admin",
    orgKey: "hospital",
  },
];

// ---------------------------------------------------------------------------
// Automation Log seed entries
// ---------------------------------------------------------------------------

/**
 * Template for automationLog entries.
 * ruleName must match the schema union literals.
 */
export interface AutomationLogTemplate {
  ruleName:
    | "checkOverdueRequests"
    | "checkMaintenanceDue"
    | "checkStockLevels"
    | "checkCertificationExpiry"
    | "autoAssignProviders";
  status: "success" | "error";
  affectedCount: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  /** Offset in hours before now for runAt */
  hoursAgo: number;
}

export const SEED_AUTOMATION_LOG_ENTRIES: AutomationLogTemplate[] = [
  // checkOverdueRequests — runs every 4 hours
  {
    ruleName: "checkOverdueRequests",
    status: "success",
    affectedCount: 3,
    metadata: {
      requestsChecked: 18,
      overdueFound: 3,
      notificationsSent: 3,
    },
    hoursAgo: 2,
  },
  {
    ruleName: "checkOverdueRequests",
    status: "success",
    affectedCount: 1,
    metadata: { requestsChecked: 17, overdueFound: 1, notificationsSent: 1 },
    hoursAgo: 6,
  },
  {
    ruleName: "checkOverdueRequests",
    status: "success",
    affectedCount: 0,
    metadata: { requestsChecked: 16, overdueFound: 0, notificationsSent: 0 },
    hoursAgo: 10,
  },
  {
    ruleName: "checkOverdueRequests",
    status: "error",
    affectedCount: 0,
    errorMessage:
      "Không thể kết nối cơ sở dữ liệu / Database connection timeout",
    metadata: { retryAttempt: 1 },
    hoursAgo: 26,
  },
  {
    ruleName: "checkOverdueRequests",
    status: "success",
    affectedCount: 2,
    metadata: { requestsChecked: 15, overdueFound: 2, notificationsSent: 2 },
    hoursAgo: 30,
  },

  // checkMaintenanceDue — runs daily at midnight
  {
    ruleName: "checkMaintenanceDue",
    status: "success",
    affectedCount: 2,
    metadata: {
      recordsChecked: 8,
      dueSoon: 2,
      overdueFound: 1,
      alertsSent: 3,
    },
    hoursAgo: 4,
  },
  {
    ruleName: "checkMaintenanceDue",
    status: "success",
    affectedCount: 1,
    metadata: { recordsChecked: 8, dueSoon: 1, overdueFound: 1, alertsSent: 2 },
    hoursAgo: 28,
  },
  {
    ruleName: "checkMaintenanceDue",
    status: "success",
    affectedCount: 0,
    metadata: { recordsChecked: 7, dueSoon: 0, overdueFound: 0, alertsSent: 0 },
    hoursAgo: 52,
  },
  {
    ruleName: "checkMaintenanceDue",
    status: "success",
    affectedCount: 3,
    metadata: { recordsChecked: 8, dueSoon: 3, overdueFound: 1, alertsSent: 4 },
    hoursAgo: 76,
  },

  // checkStockLevels — runs every 6 hours
  {
    ruleName: "checkStockLevels",
    status: "success",
    affectedCount: 2,
    metadata: {
      consumablesChecked: 3,
      belowParLevel: 2,
      reorderRequestsCreated: 1,
      alertsSent: 2,
    },
    hoursAgo: 1,
  },
  {
    ruleName: "checkStockLevels",
    status: "success",
    affectedCount: 1,
    metadata: {
      consumablesChecked: 3,
      belowParLevel: 1,
      reorderRequestsCreated: 0,
      alertsSent: 1,
    },
    hoursAgo: 7,
  },
  {
    ruleName: "checkStockLevels",
    status: "success",
    affectedCount: 0,
    metadata: {
      consumablesChecked: 3,
      belowParLevel: 0,
      reorderRequestsCreated: 0,
      alertsSent: 0,
    },
    hoursAgo: 13,
  },
  {
    ruleName: "checkStockLevels",
    status: "error",
    affectedCount: 0,
    errorMessage:
      "Lỗi xử lý mức tồn kho / Stock level processing error: Invalid par level",
    metadata: { consumableId: "CSM-ELECTRODES-001", retryAttempt: 1 },
    hoursAgo: 36,
  },

  // checkCertificationExpiry — runs weekly
  {
    ruleName: "checkCertificationExpiry",
    status: "success",
    affectedCount: 1,
    metadata: {
      certificationsChecked: 2,
      expiringSoon: 0,
      alreadyExpired: 1,
      alertsSent: 1,
    },
    hoursAgo: 12,
  },
  {
    ruleName: "checkCertificationExpiry",
    status: "success",
    affectedCount: 1,
    metadata: {
      certificationsChecked: 2,
      expiringSoon: 1,
      alreadyExpired: 1,
      alertsSent: 2,
    },
    hoursAgo: 180,
  },

  // autoAssignProviders — runs every 2 hours
  {
    ruleName: "autoAssignProviders",
    status: "success",
    affectedCount: 1,
    metadata: {
      pendingRequests: 2,
      autoAssigned: 1,
      noProviderAvailable: 1,
    },
    hoursAgo: 3,
  },
  {
    ruleName: "autoAssignProviders",
    status: "success",
    affectedCount: 0,
    metadata: {
      pendingRequests: 0,
      autoAssigned: 0,
      noProviderAvailable: 0,
    },
    hoursAgo: 5,
  },
  {
    ruleName: "autoAssignProviders",
    status: "success",
    affectedCount: 2,
    metadata: {
      pendingRequests: 3,
      autoAssigned: 2,
      noProviderAvailable: 1,
    },
    hoursAgo: 9,
  },
];

// ---------------------------------------------------------------------------
// Extra organizations for admin org management page variety
// ---------------------------------------------------------------------------

/**
 * Extra hospital orgs with trial and suspended statuses.
 * These give the admin org management page multiple rows with different statuses.
 */
export const EXTRA_HOSPITAL_ORGS = [
  {
    name: "Bệnh viện Bạch Mai Chi nhánh HCM",
    slug: "bach-mai-hcm",
    org_type: "hospital" as const,
    status: "trial" as const,
  },
  {
    name: "Bệnh viện Chợ Rẫy",
    slug: "cho-ray",
    org_type: "hospital" as const,
    status: "suspended" as const,
  },
] as const;

/**
 * Extra provider org with pending_verification status.
 * Gives the admin providers list a variety of verification states.
 * Note: providers table has its own status field (active/inactive/suspended/pending_verification)
 * which is separate from the organizations.status field (active/trial/suspended).
 * The provider org itself gets no special status (organizations.status is only for hospitals).
 */
export const EXTRA_PROVIDER_ORGS = [
  {
    name: "Công ty VietMed Services",
    slug: "vietmed-services",
    org_type: "provider" as const,
    // Provider org does not use organizations.status (it's only for hospital orgs)
    // The pending_verification status is set on the providers table record
  },
] as const;

/**
 * Extra provider profile for the VietMed Services org.
 * Status pending_verification so admin providers page shows variety.
 */
export const VIETMED_PROVIDER_PROFILE = {
  nameVi: "Dịch vụ VietMed",
  nameEn: "VietMed Services",
  companyName: "Công ty TNHH VietMed",
  descriptionVi: "Chuyên cung cấp dịch vụ sửa chữa và bảo trì thiết bị y tế tại Hà Nội",
  descriptionEn: "Specialist repair and maintenance services for medical equipment in Hanoi",
  status: "pending_verification" as const,
  verificationStatus: "pending" as const,
  contactEmail: "contact@vietmed.vn",
  contactPhone: "024-3926-5555",
  address: "145 Phố Huế, Hai Bà Trưng, Hà Nội",
  averageRating: null as number | null | undefined,
  totalRatings: 0,
  completedServices: 0,
};
