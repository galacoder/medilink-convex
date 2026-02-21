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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AiAssistantPortal = "hospital" | "provider";

interface AIAssistantWidgetProps {
  /** Which portal the widget is embedded in (affects system prompt + suggestions) */
  portal: AiAssistantPortal;
  /** CopilotKit runtime URL — always /api/copilotkit */
  runtimeUrl: string;
}

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------

/**
 * Labels for the AI assistant widget.
 * vi: "Nhãn cho widget trợ lý AI" / en: "Labels for AI assistant widget"
 */
const aiAssistantLabels = {
  floatingButton: {
    vi: "Trợ lý AI",
    en: "AI Assistant",
  },
  hospitalTitle: {
    vi: "Trợ lý thiết bị y tế",
    en: "Medical Equipment Assistant",
  },
  providerTitle: {
    vi: "Trợ lý nhà cung cấp",
    en: "Provider Assistant",
  },
  hospitalInitial: {
    vi: 'Xin chào! Tôi có thể giúp bạn:\n• Tìm thiết bị y tế ("Tìm tất cả máy X-quang hỏng")\n• Soạn yêu cầu dịch vụ ("Tạo yêu cầu bảo trì cho máy siêu âm Phòng 3")\n• Trả lời câu hỏi phân tích ("Có bao nhiêu yêu cầu dịch vụ tháng này?")',
    en: 'Hello! I can help you:\n• Find medical equipment ("Find all broken X-ray machines")\n• Draft service requests ("Create a maintenance request for ultrasound in Room 3")\n• Answer analytics questions ("How many service requests this month?")',
  },
  providerInitial: {
    vi: 'Xin chào! Tôi có thể giúp bạn:\n• Hỏi về báo giá ("Tôi có bao nhiêu báo giá đang chờ?")\n• Quản lý dịch vụ ("Dịch vụ nào đang được yêu cầu nhiều nhất?")',
    en: 'Hello! I can help you:\n• Ask about quotes ("How many pending quotes do I have?")\n• Manage services ("Which services are most requested?")',
  },
} as const;

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

  return (
    <CopilotSidebar
      labels={{
        title,
        initial: initialMessage,
        placeholder:
          portal === "hospital"
            ? "Hỏi về thiết bị, yêu cầu dịch vụ... (Ask about equipment, service requests...)"
            : "Hỏi về báo giá, dịch vụ... (Ask about quotes, services...)",
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
  );
}
