/**
 * Admin automation feature module barrel export.
 *
 * Exports all public-facing items from the admin-automation feature module.
 * Consumers should import from this barrel, NOT from internal sub-paths.
 *
 * vi: "Xuất module tự động hóa quản trị" / en: "Admin automation feature module exports"
 */

// Types
export type {
  AutomationLogEntry,
  AutomationRuleName,
  AutomationRuleStatus,
  AutomationStatus,
} from "./types";

// Labels
export { automationLabels } from "./labels";

// Hooks
export {
  useAutomationLog,
  useAutomationRuleStatus,
} from "./hooks/useAutomationLog";

// Components
export { AutomationLogTable } from "./components/AutomationLogTable";
export { AutomationRuleCards } from "./components/AutomationRuleCards";
