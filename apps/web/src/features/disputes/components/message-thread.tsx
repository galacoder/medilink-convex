"use client";

import type { FunctionReference } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { SendIcon } from "lucide-react";

import type { Id } from "@medilink/backend";
import { api } from "@medilink/backend";
import { Button } from "@medilink/ui/button";
import { Skeleton } from "@medilink/ui/skeleton";
import { Textarea } from "@medilink/ui/textarea";

import type { DisputeMessageWithAuthor } from "../types";
import { useDisputeMessages } from "../hooks/use-dispute-detail";
import { disputeLabels } from "../labels";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const disputesApi = api.disputes as any;
const addMessageFn: FunctionReference<"mutation"> = disputesApi.addMessage;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

interface MessageThreadProps {
  disputeId: Id<"disputes">;
  /** Current user's ID for aligning own messages to the right */
  currentUserId?: string;
}

/**
 * Real-time message thread for dispute communication.
 *
 * WHY: Hospital and provider teams need to exchange messages within a dispute.
 * Convex real-time subscriptions via useDisputeMessages mean the thread updates
 * automatically without polling. Auto-scroll to the latest message on new arrivals.
 *
 * vi: "Luồng tin nhắn tranh chấp" / en: "Dispute message thread"
 */
export function MessageThread({
  disputeId,
  currentUserId,
}: MessageThreadProps) {
  const { messages, isLoading } = useDisputeMessages(disputeId);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const addMessage = useMutation(addMessageFn);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      await addMessage({
        disputeId,
        contentVi: content.trim(),
      });
      setContent("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : disputeLabels.error.vi;
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
              {disputeLabels.empty.noMessages.vi}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {disputeLabels.empty.noMessagesDesc.vi}
            </p>
          </div>
        ) : (
          messages.map((msg: DisputeMessageWithAuthor) => {
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
                      {msg.authorName ?? "Người dùng"}
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
          placeholder={disputeLabels.placeholders.messageVi.vi}
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
            {disputeLabels.actions.sendMessage.vi}
          </span>
        </Button>
      </form>

      {error && <p className="text-destructive mt-1 px-3 text-sm">{error}</p>}
    </div>
  );
}
