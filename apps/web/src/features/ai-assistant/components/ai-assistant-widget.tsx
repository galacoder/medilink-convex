"use client";

/**
 * AI Assistant Widget — floating button + slide-out CopilotKit sidebar.
 *
 * WHY: Hospital and provider portal users need quick access to AI assistance
 * without leaving their current context. A floating button + slide-out panel
 * is the least intrusive UX pattern: visible but not blocking content.
 *
 * The widget:
 *   1. Shows a floating action button (bottom-right corner)
 *   2. On click, opens a CopilotSidebar with context-aware AI actions
 *   3. Provides portal-specific system prompts (hospital vs provider)
 *   4. Registers useCopilotReadable context so the LLM knows the active portal
 *
 * vi: "Widget trợ lý AI - nút nổi và bảng điều hướng CopilotKit"
 * en: "AI Assistant Widget - floating button and CopilotKit slide-out panel"
 */
import { useState } from "react";
import { CopilotKit, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";

import "@copilotkit/react-ui/styles.css";

import { ClassErrorBoundary } from "~/components/error-boundary";

import type { AiAssistantPortal } from "../types";
import { aiAssistantLabels } from "../labels";

interface AIAssistantWidgetProps {
  /** Which portal the widget is embedded in (affects system prompt + suggestions) */
  portal: AiAssistantPortal;
  /** CopilotKit runtime URL — always /api/copilotkit */
  runtimeUrl: string;
}

// ---------------------------------------------------------------------------
// Inner component (needs CopilotKit provider context)
// ---------------------------------------------------------------------------

/**
 * Inner widget that registers readable state and renders the sidebar.
 * Must be rendered inside <CopilotKit> provider.
 *
 * vi: "Widget bên trong đăng ký trạng thái có thể đọc và hiển thị bảng điều hướng"
 * en: "Inner widget that registers readable state and renders the sidebar"
 */
function AIAssistantInner({
  portal,
  isOpen,
  onClose,
}: {
  portal: AiAssistantPortal;
  isOpen: boolean;
  onClose: () => void;
}) {
  // Share current portal context with the LLM
  // WHY: This lets the AI know which portal it's in and tailor responses
  useCopilotReadable({
    description: "Current portal context",
    value: {
      portal,
      portalLabel:
        portal === "hospital"
          ? "Hospital portal — medical equipment management for SPMET Healthcare School"
          : "Provider portal — service provider managing quotes and service offerings",
    },
  });

  if (!isOpen) {
    return null;
  }

  const title =
    portal === "hospital"
      ? aiAssistantLabels.hospitalTitle.vi
      : aiAssistantLabels.providerTitle.vi;

  const initialMessage =
    portal === "hospital"
      ? aiAssistantLabels.hospitalInitial.vi
      : aiAssistantLabels.providerInitial.vi;

  const placeholder =
    portal === "hospital"
      ? aiAssistantLabels.hospitalPlaceholder.vi
      : aiAssistantLabels.providerPlaceholder.vi;

  return (
    <CopilotSidebar
      labels={{
        title,
        initial: initialMessage,
        placeholder,
      }}
      onSetOpen={(open) => {
        if (!open) {
          onClose();
        }
      }}
      defaultOpen={true}
      clickOutsideToClose={true}
    />
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

/**
 * AI Assistant Widget — floating button + CopilotKit slide-out sidebar.
 *
 * Embeds CopilotKit provider and renders a floating action button.
 * The button toggles the CopilotSidebar slide-out panel.
 *
 * Usage:
 *   <AIAssistantWidget portal="hospital" runtimeUrl="/api/copilotkit" />
 *
 * vi: "Widget trợ lý AI - nút nổi và bảng trượt CopilotKit"
 * en: "AI Assistant Widget - floating button and CopilotKit slide-out sidebar"
 */
export function AIAssistantWidget({
  portal,
  runtimeUrl,
}: AIAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // WHY: CopilotKit throws a runtime error when the backend has no agents
    // registered (e.g., missing OPENAI_API_KEY or empty CopilotRuntime).
    // The AI assistant is optional — a crash here must never block the page.
    <ClassErrorBoundary fallback={() => null}>
    <CopilotKit runtimeUrl={runtimeUrl}>
      {/* Floating action button — bottom-right corner */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`${aiAssistantLabels.floatingButton.vi} (${aiAssistantLabels.floatingButton.en})`}
        className="bg-primary text-primary-foreground focus:ring-primary fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-none"
        title={`${aiAssistantLabels.floatingButton.vi} / ${aiAssistantLabels.floatingButton.en}`}
      >
        {/* Bot/Chat icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
      </button>

      {/* Slide-out CopilotKit sidebar */}
      <AIAssistantInner
        portal={portal}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </CopilotKit>
    </ClassErrorBoundary>
  );
}
