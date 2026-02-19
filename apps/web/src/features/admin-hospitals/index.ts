/**
 * Admin Hospitals feature module public API.
 *
 * WHY: Single entry point for importing from the admin-hospitals feature.
 * Components, hooks, and types are all re-exported from here to enforce
 * feature boundaries and avoid deep relative imports.
 *
 * vi: "API công khai module quản lý bệnh viện" / en: "Admin hospitals feature public API"
 */

// Types
export * from "./types";

// Labels
export { adminHospitalLabels } from "./labels";

// Hooks
export { useAdminHospitals } from "./hooks/use-admin-hospitals";
export { useHospitalDetail } from "./hooks/use-hospital-detail";

// Components
export { HospitalTable } from "./components/hospital-table";
export { HospitalStatusBadge } from "./components/hospital-status-badge";
export { HospitalFiltersBar } from "./components/hospital-filters";
export {
  OnboardHospitalDialog,
  SuspendHospitalDialog,
  ReactivateHospitalDialog,
} from "./components/hospital-actions";
