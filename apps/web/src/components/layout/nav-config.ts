/**
 * Navigation configuration for all portal sidebars.
 *
 * WHY: All three portals (hospital, provider, platform-admin) share the same
 * layout structure (Sidebar, Header, MobileNav) but have different navigation
 * items. Centralizing nav config here makes it easy to update per-portal nav
 * without touching the layout components.
 */
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  ScanLine,
  Settings,
  Shield,
  Stethoscope,
  Truck,
  User,
  Users,
  Wrench,
} from "lucide-react";

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: {
    vi: string;
    en: string;
  };
  badge?: string;
}

/**
 * Hospital portal navigation — equipment borrowing, service requests, consumables.
 */
export const hospitalNavItems: NavItem[] = [
  {
    href: "/hospital/dashboard",
    icon: LayoutDashboard,
    label: { vi: "Tổng quan", en: "Dashboard" },
  },
  {
    href: "/hospital/equipment",
    icon: Stethoscope,
    label: { vi: "Thiết bị y tế", en: "Equipment" },
  },
  {
    href: "/hospital/scan",
    icon: ScanLine,
    label: { vi: "Quét mã QR", en: "QR Scan" },
  },
  {
    href: "/hospital/service-requests",
    icon: ClipboardList,
    label: { vi: "Yêu cầu dịch vụ", en: "Service Requests" },
  },
  {
    href: "/hospital/consumables",
    icon: Package,
    label: { vi: "Vật tư tiêu hao", en: "Consumables" },
  },
  {
    href: "/hospital/disputes",
    icon: AlertCircle,
    label: { vi: "Khiếu nại", en: "Disputes" },
  },
  {
    href: "/hospital/members",
    icon: Users,
    label: { vi: "Thành viên", en: "Members" },
  },
  {
    href: "/hospital/settings",
    icon: Settings,
    label: { vi: "Cài đặt", en: "Settings" },
  },
];

/**
 * Provider portal navigation — service offerings, quotes, analytics.
 */
export const providerNavItems: NavItem[] = [
  {
    href: "/provider/dashboard",
    icon: LayoutDashboard,
    label: { vi: "Tổng quan", en: "Dashboard" },
  },
  {
    href: "/provider/service-requests",
    icon: ClipboardList,
    label: { vi: "Yêu cầu dịch vụ", en: "Service Requests" },
  },
  {
    href: "/provider/offerings",
    icon: Briefcase,
    label: { vi: "Dịch vụ", en: "Offerings" },
  },
  {
    href: "/provider/certifications",
    icon: Award,
    label: { vi: "Chứng chỉ", en: "Certifications" },
  },
  {
    href: "/provider/profile",
    icon: User,
    label: { vi: "Hồ sơ", en: "Profile" },
  },
  {
    href: "/provider/quotes",
    icon: FileText,
    label: { vi: "Báo giá", en: "Quotes" },
  },
  {
    href: "/provider/services",
    icon: Wrench,
    label: { vi: "Dịch vụ", en: "Services" },
  },
  {
    href: "/provider/analytics",
    icon: BarChart3,
    label: { vi: "Phân tích", en: "Analytics" },
  },
  {
    href: "/provider/members",
    icon: Users,
    label: { vi: "Thành viên", en: "Members" },
  },
  {
    href: "/provider/settings",
    icon: Settings,
    label: { vi: "Cài đặt", en: "Settings" },
  },
];

/**
 * Platform admin navigation — manage hospitals, providers, system-wide oversight.
 */
export const adminNavItems: NavItem[] = [
  {
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    label: { vi: "Tổng quan", en: "Dashboard" },
  },
  {
    href: "/admin/hospitals",
    icon: Building2,
    label: { vi: "Bệnh viện", en: "Hospitals" },
  },
  {
    href: "/admin/providers",
    icon: Truck,
    label: { vi: "Nhà cung cấp", en: "Providers" },
  },
  {
    href: "/admin/service-requests",
    icon: ClipboardList,
    label: { vi: "Yêu cầu dịch vụ", en: "Service Requests" },
  },
  {
    href: "/admin/disputes",
    icon: AlertCircle,
    label: { vi: "Tranh chấp leo thang", en: "Escalated Disputes" },
  },
  {
    href: "/admin/analytics",
    icon: BarChart3,
    label: { vi: "Phân tích", en: "Analytics" },
  },
  {
    href: "/admin/audit-log",
    icon: Shield,
    label: { vi: "Nhật ký kiểm tra", en: "Audit Log" },
  },
];
