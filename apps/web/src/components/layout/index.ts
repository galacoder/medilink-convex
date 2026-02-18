/**
 * Layout components barrel export.
 *
 * WHY: Single import point for all shared portal layout components.
 * Portal layouts import from here rather than individual files.
 */
export { Header } from "./header";
export { MobileNav } from "./mobile-nav";
export { Sidebar } from "./sidebar";
export {
  adminNavItems,
  hospitalNavItems,
  providerNavItems,
} from "./nav-config";
export type { NavItem } from "./nav-config";
