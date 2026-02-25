"use client";

/**
 * AI Chat Page — full-page conversation UI with sidebar and message area.
 *
 * WHY: Hospital and provider users need a dedicated page for AI conversations
 * with persistent history. Shows conversation list sidebar on the left and
 * the active conversation thread on the right.
 *
 * vi: "Trang tro chuyen AI" / en: "AI chat page"
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { BotIcon, PlusIcon, SendIcon, UserIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";
import { ScrollArea } from "@medilink/ui/scroll-area";

import type { AiAssistantPortal, AiMessage } from "../types";
import { useAiHistory } from "../hooks/use-ai-history";
import { aiAssistantLabels } from "../labels";
import { AiChatHistory } from "./ai-chat-history";

interface AiChatPageProps {
  /** Which portal context */
  portal: AiAssistantPortal;
  /** Active organization ID */
  organizationId: string | undefined;
}

/**
 * Full-page AI chat interface with conversation list and message thread.
 *
 * vi: "Giao dien tro chuyen AI toan trang" / en: "Full-page AI chat interface"
 */
export function AiChatPage({ portal, organizationId }: AiChatPageProps) {
  const {
    conversations,
    isLoading,
    selectedConversation,
    selectConversation,
    clearSelection,
    createConversation,
    deleteConversation,
    addMessage,
  } = useAiHistory(organizationId);

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  const handleCreateConversation = useCallback(async () => {
    const titleVi =
      portal === "hospital" ? "Hoi thoai moi" : "Hoi thoai nha cung cap moi";
    const titleEn =
      portal === "hospital" ? "New conversation" : "New provider conversation";

    const id = await createConversation(titleVi, titleEn);
    selectConversation(id);
  }, [createConversation, selectConversation, portal]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !selectedConversation || isSending) return;

    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    try {
      // Add user message
      await addMessage(selectedConversation._id, "user", content);

      // Add stub assistant response
      await addMessage(
        selectedConversation._id,
        "assistant",
        aiAssistantLabels.stubResponse.vi,
      );
    } finally {
      setIsSending(false);
    }
  }, [inputValue, selectedConversation, isSending, addMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  return (
    <div
      className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-lg border"
      data-testid="ai-chat-page"
    >
      {/* Sidebar — conversation list */}
      <div className="flex w-72 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            {aiAssistantLabels.conversations.vi}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateConversation}
            className="h-8 w-8 p-0"
            aria-label={aiAssistantLabels.newConversation.vi}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <AiChatHistory
            conversations={conversations}
            selectedId={selectedConversation?._id}
            onSelect={selectConversation}
            onDelete={deleteConversation}
            isLoading={isLoading}
          />
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between border-b px-6 py-3">
              <div>
                <h3 className="text-sm font-semibold">
                  {selectedConversation.titleVi}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {selectedConversation.titleEn}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {selectedConversation.messages.map(
                  (message: AiMessage, index: number) => (
                    <MessageBubble key={index} message={message} />
                  ),
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="border-t px-6 py-4">
              <div className="flex gap-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={aiAssistantLabels.inputPlaceholder.vi}
                  className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  rows={1}
                  disabled={isSending}
                  data-testid="chat-input"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isSending}
                  size="sm"
                  className="h-auto"
                  aria-label={aiAssistantLabels.sendMessage.vi}
                  data-testid="send-button"
                >
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state — no conversation selected */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <BotIcon className="text-muted-foreground h-12 w-12" />
            <div>
              <p className="text-muted-foreground text-sm">
                {aiAssistantLabels.selectOrCreate.vi}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {aiAssistantLabels.selectOrCreate.en}
              </p>
            </div>
            <Button variant="outline" onClick={handleCreateConversation}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {aiAssistantLabels.newConversation.vi}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Single message bubble with role icon and timestamp.
 *
 * vi: "Bong bong tin nhan" / en: "Message bubble"
 */
function MessageBubble({ message }: { message: AiMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      data-testid={`message-${message.role}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? (
          <UserIcon className="h-4 w-4" />
        ) : (
          <BotIcon className="h-4 w-4" />
        )}
      </div>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={`mt-1 text-xs ${
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
