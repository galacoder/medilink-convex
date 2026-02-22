"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@medilink/ui/card";
import { Skeleton } from "@medilink/ui/skeleton";

import type { SupportTicketWithDetails } from "../types";
import { supportLabels } from "../labels";
import { MessageThread } from "./message-thread";
import { SupportStatusBadge } from "./support-status-badge";

interface TicketDetailProps {
  ticket: SupportTicketWithDetails | null;
  isLoading?: boolean;
  currentUserId?: string;
}

/**
 * Support ticket detail view with metadata and message thread.
 *
 * WHY: The detail page displays the full ticket info (subject, description,
 * category, priority, status) plus the message thread for communication.
 * This follows the disputes detail pattern.
 *
 * vi: "Chi tiet phieu ho tro" / en: "Support ticket detail"
 */
export function TicketDetail({
  ticket,
  isLoading = false,
  currentUserId,
}: TicketDetailProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-48 rounded-xl" />
              ))}
            </div>
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
          Khong tim thay phieu ho tro.
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          (Support ticket not found.)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ticket info card */}
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
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {/* Category */}
            <div>
              <dt className="text-muted-foreground font-medium">
                {supportLabels.fields.category.vi}
              </dt>
              <dd>{supportLabels.categories[ticket.category].vi}</dd>
            </div>
            {/* Priority */}
            <div>
              <dt className="text-muted-foreground font-medium">
                {supportLabels.fields.priority.vi}
              </dt>
              <dd>{supportLabels.priorities[ticket.priority].vi}</dd>
            </div>
            {/* Creator */}
            <div>
              <dt className="text-muted-foreground font-medium">
                {supportLabels.fields.createdBy.vi}
              </dt>
              <dd>{ticket.creatorName ?? "---"}</dd>
            </div>
            {/* Created at */}
            <div>
              <dt className="text-muted-foreground font-medium">
                {supportLabels.fields.createdAt.vi}
              </dt>
              <dd>
                {new Date(ticket.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
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
            {ticket.descriptionEn && (
              <>
                <h4 className="text-muted-foreground mt-3 mb-1 text-sm font-medium">
                  {supportLabels.fields.descriptionEn.vi}
                </h4>
                <p className="text-muted-foreground text-sm italic whitespace-pre-wrap">
                  {ticket.descriptionEn}
                </p>
              </>
            )}
          </div>
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
          <MessageThread
            ticketId={ticket._id}
            messages={ticket.messages}
            currentUserId={currentUserId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
