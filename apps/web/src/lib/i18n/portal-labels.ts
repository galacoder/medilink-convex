/**
 * Bilingual portal labels (Vietnamese primary, English secondary).
 *
 * WHY: Centralized labels for portal names and common UI elements
 * shared across portal dashboards. Follows the same pattern as auth-labels.ts.
 */
export const portalLabels = {
  hospital: {
    name: { vi: "Cổng thông tin Bệnh viện", en: "Hospital Portal" },
    welcome: {
      vi: "Chào mừng đến Cổng thông tin Bệnh viện MediLink",
      en: "Welcome to MediLink Hospital Portal",
    },
    dashboard: { vi: "Tổng quan", en: "Dashboard" },
  },
  provider: {
    name: { vi: "Cổng thông tin Nhà cung cấp", en: "Provider Portal" },
    welcome: {
      vi: "Chào mừng đến Cổng thông tin Nhà cung cấp MediLink",
      en: "Welcome to MediLink Provider Portal",
    },
    dashboard: { vi: "Tổng quan", en: "Dashboard" },
  },
  admin: {
    name: { vi: "Cổng quản lý nền tảng", en: "Platform Admin Portal" },
    welcome: {
      vi: "Chào mừng đến Cổng quản lý nền tảng MediLink",
      en: "Welcome to MediLink Platform Admin Portal",
    },
    dashboard: { vi: "Tổng quan", en: "Dashboard" },
  },
  common: {
    loading: { vi: "Đang tải...", en: "Loading..." },
    error: { vi: "Đã xảy ra lỗi", en: "An error occurred" },
    retry: { vi: "Thử lại", en: "Retry" },
  },
} as const;

export type PortalLabels = typeof portalLabels;
