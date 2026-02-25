"use client";

/**
 * AI Chat History — displays a list of past AI conversations with delete support.
 *
 * WHY: Users need to review, resume, and manage past AI conversations.
 * Each item shows the conversation title, date, and a delete button.
 *
 * vi: "Lich su tro chuyen AI" / en: "AI chat history"
 */
import { useState } from "react";
import { Trash2Icon } from "lucide-react";

import { Button } from "@medilink/ui/button";

import type { AiConversation } from "../types";
import { aiAssistantLabels } from "../labels";

interface AiChatHistoryProps {
  /** Conversation list */
  conversations: AiConversation[];
  /** Currently selected conversation ID */
  selectedId?: string;
  /** Callback when a conversation is selected */
  onSelect?: (id: string) => void;
  /** Callback when a conversation should be deleted */
  onDelete?: (id: string) => void;
  /** Loading state */
  isLoading?: boolean;
  locale?: "vi" | "en";
}

/**
 * Displays a list of past AI conversations with selection and delete support.
 *
 * vi: "Lich su hoi thoai AI" / en: "AI chat history list"
 */
export function AiChatHistory({
  conversations,
  selectedId,
  onSelect,
  onDelete,
  isLoading = false,
  locale = "vi",
}: AiChatHistoryProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-10 animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-center"
        data-testid="no-conversations"
      >
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
    <div className="space-y-1 p-2" data-testid="conversation-list">
      <h3 className="text-muted-foreground px-2 py-1 text-xs font-semibold tracking-wider uppercase">
        {aiAssistantLabels.historyTitle[locale]}
      </h3>
      {conversations.map((conversation) => {
        const title =
          locale === "vi" ? conversation.titleVi : conversation.titleEn;
        const isSelected = conversation._id === selectedId;
        const isConfirming = confirmDeleteId === conversation._id;

        return (
          <div key={conversation._id} className="relative">
            {isConfirming ? (
              <div className="border-destructive/30 bg-destructive/5 flex items-center gap-2 rounded-md border px-3 py-2">
                <p className="flex-1 text-xs">
                  {aiAssistantLabels.deleteConfirm[locale]}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    onDelete?.(conversation._id);
                    setConfirmDeleteId(null);
                  }}
                >
                  {aiAssistantLabels.confirm[locale]}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  {aiAssistantLabels.cancel[locale]}
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSelect?.(conversation._id)}
                className={[
                  "group flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(conversation._id);
                  }}
                  className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={aiAssistantLabels.deleteConversation[locale]}
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </button>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
