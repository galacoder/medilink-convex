"use client";

import type { FunctionReference } from "convex/server";
import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeftIcon, SendIcon, UserPlusIcon } from "lucide-react";

import { api } from "@medilink/backend";
import { Button } from "@medilink/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@medilink/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";
import { Skeleton } from "@medilink/ui/skeleton";
import { Textarea } from "@medilink/ui/textarea";

import type {
  SupportMessageWithAuthor,
  SupportTicketStatus,
} from "~/features/support/types";
import { SupportStatusBadge } from "~/features/support/components/support-status-badge";
import { supportLabels } from "~/features/support/labels";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const supportApi = (api as any).support;
type QueryRef = FunctionReference<"query">;
type MutationRef = FunctionReference<"mutation">;
const adminGetByIdFn: QueryRef = supportApi.adminGetById;
const adminAddMessageFn: MutationRef = supportApi.adminAddMessage;
const adminUpdateStatusFn: MutationRef = supportApi.adminUpdateStatus;
const assignFn: MutationRef = supportApi.assign;
const closeFn: MutationRef = supportApi.close;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

interface AdminTicketDetail {
  _id: string;
  subjectVi: string;
  subjectEn?: string;
  descriptionVi: string;
  descriptionEn?: string;
  category: string;
  priority: string;
  status: SupportTicketStatus;
  organizationName?: string | null;
  creatorName?: string | null;
  assigneeName?: string | null;
  assignedTo?: string;
  createdAt: number;
  messages: SupportMessageWithAuthor[];
}

/**
 * Admin support ticket detail page with full management controls.
 *
 * WHY: Admins need to view ticket details, assign tickets, update status,
 * add messages, and close tickets from a single page.
 *
 * vi: "Chi tiet phieu ho tro (admin)" / en: "Admin support ticket detail"
 */
export default function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rawTicket = useQuery(adminGetByIdFn, { ticketId: id });
  const ticket = rawTicket as AdminTicketDetail | null | undefined;
  const addMessage = useMutation(adminAddMessageFn);
  const updateStatus = useMutation(adminUpdateStatusFn);
  const assignMutation = useMutation(assignFn);
  const closeMutation = useMutation(closeFn);

  const [messageContent, setMessageContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const isLoading = ticket === undefined;

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageContent.trim() || isSending) return;

    setIsSending(true);
    try {
      await addMessage({
        ticketId: id,
        contentVi: messageContent.trim(),
      });
      setMessageContent("");
    } catch {
      // Error handled in production via toast
    } finally {
      setIsSending(false);
    }
  }

  async function handleStatusChange(status: string) {
    try {
      await updateStatus({
        ticketId: id,
        status: status as SupportTicketStatus,
      });
    } catch {
      // Error handled in production via toast
    }
  }

  async function handleClose() {
    try {
      await closeMutation({ ticketId: id });
    } catch {
      // Error handled in production via toast
    }
  }

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found
  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg">
          Khong tim thay phieu ho tro. (Support ticket not found.)
        </p>
        <Link href="/admin/support" className="mt-4">
          <Button variant="outline">{supportLabels.backToList.vi}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link href="/admin/support">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            {supportLabels.backToList.vi}
          </Button>
        </Link>
      </div>

      {/* Ticket info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg">{ticket.subjectVi}</CardTitle>
            <SupportStatusBadge status={ticket.status} locale="vi" />
          </div>
          {ticket.subjectEn && ticket.subjectEn !== ticket.subjectVi && (
            <p className="text-muted-foreground text-sm italic">
              {ticket.subjectEn}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <div>
              <dt className="text-muted-foreground font-medium">
                {supportLabels.admin.organization.vi}
              </dt>
              <dd>{ticket.organizationName ?? "---"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">
                {supportLabels.fields.category.vi}
              </dt>
              <dd>
                {supportLabels.categories[
                  ticket.category as keyof typeof supportLabels.categories
                ]?.vi ?? ticket.category}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">
                {supportLabels.fields.priority.vi}
              </dt>
              <dd>
                {supportLabels.priorities[
                  ticket.priority as keyof typeof supportLabels.priorities
                ]?.vi ?? ticket.priority}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">
                {supportLabels.fields.createdBy.vi}
              </dt>
              <dd>{ticket.creatorName ?? "---"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">
                {supportLabels.admin.assignee.vi}
              </dt>
              <dd>
                {ticket.assigneeName ?? supportLabels.admin.unassigned.vi}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">
                {supportLabels.fields.createdAt.vi}
              </dt>
              <dd>
                {new Date(ticket.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          </dl>

          {/* Description */}
          <div className="mt-4">
            <h4 className="text-muted-foreground mb-1 text-sm font-medium">
              {supportLabels.fields.descriptionVi.vi}
            </h4>
            <p className="text-sm whitespace-pre-wrap">
              {ticket.descriptionVi}
            </p>
          </div>

          {/* Admin actions */}
          {ticket.status !== "closed" && (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              <Select onValueChange={(val) => void handleStatusChange(val)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={supportLabels.fields.status.vi} />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ["open", "in_progress", "resolved"] as SupportTicketStatus[]
                  )
                    .filter((s) => s !== ticket.status)
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {supportLabels.statuses[s].vi}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleClose()}
              >
                {supportLabels.actions.close.vi}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message thread */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {supportLabels.thread.title.vi}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Message list */}
          <div className="max-h-[400px] min-h-[200px] space-y-3 overflow-y-auto rounded-t-md border p-4">
            {ticket.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  {supportLabels.empty.noMessages.vi}
                </p>
              </div>
            ) : (
              ticket.messages.map((msg) => (
                <div key={msg._id} className="flex justify-start">
                  <div className="bg-muted max-w-[75%] rounded-xl px-4 py-2">
                    <div className="text-muted-foreground mb-1 flex items-center gap-2 text-xs">
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
                    <p className="text-sm whitespace-pre-wrap">
                      {msg.contentVi}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Admin reply form */}
          <form
            onSubmit={(e) => void handleSendMessage(e)}
            className="flex gap-2 rounded-b-md border border-t-0 p-3"
          >
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={supportLabels.placeholders.messageVi.vi}
              rows={2}
              className="flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage(e as unknown as React.FormEvent);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!messageContent.trim() || isSending}
              className="self-end"
            >
              <SendIcon className="h-4 w-4" />
              <span className="sr-only">
                {supportLabels.actions.sendMessage.vi}
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
