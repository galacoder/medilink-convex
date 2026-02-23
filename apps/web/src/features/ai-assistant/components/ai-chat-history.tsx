"use client";

/**
 * AI Chat History — displays a list of past AI conversations.
 *
 * WHY: Users need to review and resume past AI conversations. This component
 * is a skeleton in Wave 1 (displays empty state) and will be wired to the
 * aiConversation Convex table in Wave 2 when persistence is added.
 *
 * vi: "Lịch sử trò chuyện AI" / en: "AI chat history"
 */
import type { AiConversation } from "../types";
import { aiAssistantLabels } from "../labels";

interface AiChatHistoryProps {
  /** Conversation list (empty in Wave 1, populated in Wave 2) */
  conversations?: AiConversation[];
  /** Currently selected conversation ID */
  selectedId?: string;
  /** Callback when a conversation is selected */
  onSelect?: (id: string) => void;
  /** Loading state */
  isLoading?: boolean;
  locale?: "vi" | "en";
}

/**
 * Displays a list of past AI conversations with selection support.
 *
 * NOTE: Returns empty state in Wave 1. Wire-up in Wave 2 when the
 * aiConversation table and listConversations query are added.
 *
 * vi: "Lịch sử hội thoại AI" / en: "AI chat history list"
 */
export function AiChatHistory({
  conversations = [],
  selectedId,
  onSelect,
  isLoading = false,
  locale = "vi",
}: AiChatHistoryProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">
          {aiAssistantLabels.loading[locale]}
        </p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="text-muted-foreground text-3xl">💬</div>
        <p className="text-muted-foreground mt-2 text-sm">
          {aiAssistantLabels.noHistory[locale]}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {aiAssistantLabels.noHistoryDesc[locale]}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      <h3 className="text-muted-foreground px-2 py-1 text-xs font-semibold tracking-wider uppercase">
        {aiAssistantLabels.historyTitle[locale]}
      </h3>
      {conversations.map((conversation) => {
        const title =
          locale === "vi" ? conversation.titleVi : conversation.titleEn;
        const isSelected = conversation._id === selectedId;

        return (
          <button
            key={conversation._id}
            type="button"
            onClick={() => onSelect?.(conversation._id)}
            className={[
              "flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
              "hover:bg-accent",
              isSelected ? "bg-accent font-medium" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="flex-1 truncate">{title}</span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {new Date(conversation.updatedAt).toLocaleDateString(
                locale === "vi" ? "vi-VN" : "en-US",
                { month: "short", day: "numeric" },
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
