"use client";

import type { FunctionReference } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { SendIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";
import { Skeleton } from "@medilink/ui/skeleton";
import { Textarea } from "@medilink/ui/textarea";

import type { SupportMessageWithAuthor } from "../types";
import { supportLabels } from "../labels";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const supportApi = (api as any).support;
const addMessageFn: FunctionReference<"mutation"> = supportApi.addMessage;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

interface MessageThreadProps {
  ticketId: string;
  messages: SupportMessageWithAuthor[];
  isLoading?: boolean;
  /** Current user's ID for aligning own messages to the right */
  currentUserId?: string;
}

/**
 * Real-time message thread for support ticket communication.
 *
 * WHY: Support staff and ticket creators need to exchange messages within
 * a ticket. This follows the disputes/message-thread.tsx pattern with
 * auto-scroll on new arrivals and Enter-to-send keyboard shortcut.
 *
 * vi: "Luong tin nhan phieu ho tro" / en: "Support message thread"
 */
export function MessageThread({
  ticketId,
  messages,
  isLoading = false,
  currentUserId,
}: MessageThreadProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const addMessage = useMutation(addMessageFn);

  // Auto-scroll to bottom when messages change
  // WHY: jsdom does not implement scrollIntoView, so guard against it
  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      await addMessage({
        ticketId,
        contentVi: content.trim(),
      });
      setContent("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : supportLabels.error.vi;
      setError(msg);
    } finally {
      setIsSending(false);
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <Skeleton
              className={`h-12 w-48 rounded-xl ${i % 2 === 0 ? "" : "bg-primary/20"}`}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Message list */}
      <div className="max-h-[400px] min-h-[200px] space-y-3 overflow-y-auto rounded-t-md border p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {supportLabels.empty.noMessages.vi}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {supportLabels.empty.noMessagesDesc.vi}
            </p>
          </div>
        ) : (
          messages.map((msg: SupportMessageWithAuthor) => {
            const isOwn = msg.authorId === currentUserId;
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-2 ${
                    isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {/* Author + timestamp */}
                  <div
                    className={`mb-1 flex items-center gap-2 text-xs ${
                      isOwn
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="font-medium">
                      {msg.authorName ?? "Nguoi dung"}
                    </span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {/* Content */}
                  <p className="text-sm whitespace-pre-wrap">{msg.contentVi}</p>
                  {msg.contentEn && msg.contentEn !== msg.contentVi && (
                    <p
                      className={`mt-1 text-xs italic ${
                        isOwn
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {msg.contentEn}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* New message form */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 rounded-b-md border border-t-0 p-3"
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={supportLabels.placeholders.messageVi.vi}
          rows={2}
          className="flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend(e as unknown as React.FormEvent);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || isSending}
          className="self-end"
        >
          <SendIcon className="h-4 w-4" />
          <span className="sr-only">
            {supportLabels.actions.sendMessage.vi}
          </span>
        </Button>
      </form>

      {error && <p className="text-destructive mt-1 px-3 text-sm">{error}</p>}
    </div>
  );
}
