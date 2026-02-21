"use client";

import type { ReactNode } from "react";

import { AIAssistantWidget } from "~/components/ai-assistant";
import { providerNavItems } from "~/components/layout/nav-config";
import { PortalLayout } from "~/components/layout/portal-layout";
import { ConvexAuthGuard } from "~/components/providers/convex-auth-guard";

/**
 * Provider portal layout — wraps all /provider/* pages with sidebar + header.
 *
 * WHY: All provider routes share the same navigation structure.
 * Using a route group layout keeps provider pages isolated from
 * hospital and admin portals while sharing the PortalLayout component.
 *
 * ConvexAuthGuard prevents UNAUTHENTICATED query errors on first load.
 * See ConvexAuthGuard for full explanation.
 *
 * AIAssistantWidget provides a floating AI chat button (simpler scope:
 * quote management help and basic service queries).
 * vi: "Widget trợ lý AI cho cổng nhà cung cấp"
 * en: "AI assistant widget for provider portal"
 */
export default function ProviderLayout({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthGuard>
      <PortalLayout navItems={providerNavItems}>{children}</PortalLayout>
      <AIAssistantWidget portal="provider" runtimeUrl="/api/copilotkit" />
    </ConvexAuthGuard>
  );
}
