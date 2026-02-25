/**
 * Billing admin layout.
 *
 * WHY: All /admin/billing/* routes share the same layout,
 * which is the parent admin layout (sidebar + header).
 * This layout is a pass-through — the admin layout handles all chrome.
 *
 * vi: "Layout thanh toan admin" / en: "Billing admin layout"
 *
 * @see Issue #172 — M1-3: Admin Subscription Management Panel
 */
import type { ReactNode } from "react";

export default function BillingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
