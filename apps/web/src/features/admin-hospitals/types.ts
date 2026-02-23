/**
 * Types for the admin-hospitals feature module.
 *
 * WHY: Centralizing type definitions ensures consistent typing across
 * hooks, components, and pages without duplicating definitions.
 *
 * vi: "Kiểu dữ liệu quản lý bệnh viện" / en: "Hospital management types"
 */
import type { Id } from "@medilink/db/dataModel";

// Hospital status type — managed by platform_admin
export type HospitalStatus = "active" | "suspended" | "trial";

// Hospital org summary (from listHospitals query)
export interface HospitalSummary {
  _id: Id<"organizations">;
  name: string;
  slug: string;
  org_type: "hospital" | "provider";
  // vi: "Trạng thái bệnh viện" / en: "Hospital status"
  status: HospitalStatus;
  memberCount: number;
  equipmentCount: number;
  createdAt: number;
  updatedAt: number;
}

// Paginated hospital list result (from listHospitals query)
export interface HospitalListResult {
  hospitals: HospitalSummary[];
  total: number;
  pageSize: number;
  offset: number;
  hasMore: boolean;
}

// Member summary (from getHospitalDetail query)
export interface HospitalMember {
  membershipId: Id<"organizationMemberships">;
  userId: Id<"users">;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  createdAt: number;
}

// Equipment summary (from getHospitalDetail query)
export interface EquipmentSummary {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
  damaged: number;
  retired: number;
}

// Service request summary (from getHospitalDetail query)
export interface ServiceRequestSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

// Hospital detail result (from getHospitalDetail query)
export interface HospitalDetail {
  organization: {
    _id: Id<"organizations">;
    name: string;
    slug: string;
    org_type: "hospital" | "provider";
    status: HospitalStatus;
    createdAt: number;
    updatedAt: number;
  };
  members: HospitalMember[];
  equipmentSummary: EquipmentSummary;
  serviceRequestSummary: ServiceRequestSummary;
}

// Hospital usage metrics (from getHospitalUsage query)
export interface HospitalUsage {
  equipmentCount: number;
  serviceRequestCount: number;
  activeMembers: number;
}

// Filter state for hospital list
export interface HospitalFilters {
  search?: string;
  status?: HospitalStatus;
}
