"use client";

import { useState } from "react";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";
import { Separator } from "@medilink/ui/separator";
import { Skeleton } from "@medilink/ui/skeleton";

import { settingsLabels } from "~/lib/i18n/settings-labels";

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt?: string | null;
}

interface InviteMemberFormProps {
  /**
   * Called when the invite form is submitted.
   * Page component handles the tRPC inviteMember call.
   */
  onInvite: (email: string, role: "admin" | "member") => Promise<void>;
  /**
   * Called when a pending invite is revoked.
   */
  onRevokeInvite?: (invitationId: string) => Promise<void>;
  /** List of pending invitations to display below the form */
  pendingInvites?: PendingInvite[];
  isLoadingInvites?: boolean;
}

/**
 * Invite member form with pending invitations list.
 *
 * WHY: Org owners/admins invite members via email. The form validates
 * the email and role, then calls onInvite which the page connects to tRPC.
 * Pending invites are shown below so users can revoke outstanding invitations.
 */
export function InviteMemberForm({
  onInvite,
  onRevokeInvite,
  pendingInvites = [],
  isLoadingInvites = false,
}: InviteMemberFormProps) {
  const labels = settingsLabels.invite;

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setEmailError(null);

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(
        "Email không hợp lệ (Invalid email address)",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await onInvite(email, role);
      setFeedback({ type: "success", message: labels.success.vi });
      setEmail(""); // Reset form on success
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : labels.error.vi,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRevoke(invitationId: string) {
    if (!onRevokeInvite) return;
    setRevokingId(invitationId);
    try {
      await onRevokeInvite(invitationId);
      setFeedback({ type: "success", message: labels.revokeSuccess.vi });
    } catch {
      setFeedback({ type: "error", message: labels.revokeError.vi });
    } finally {
      setRevokingId(null);
    }
  }

  function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "pending":
        return "secondary";
      case "accepted":
        return "default";
      case "expired":
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "pending":
        return labels.pending.statuses.pending.vi;
      case "accepted":
        return labels.pending.statuses.accepted.vi;
      case "expired":
        return labels.pending.statuses.expired.vi;
      case "rejected":
        return labels.pending.statuses.rejected.vi;
      default:
        return status;
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Feedback banner */}
        {feedback && (
          <div
            className={`rounded-md px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Email input */}
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="invite-email">
              {labels.form.email.vi}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                ({labels.form.email.en})
              </span>
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              placeholder={labels.form.emailPlaceholder.vi}
            />
            {emailError && (
              <p className="text-destructive text-xs">{emailError}</p>
            )}
          </div>

          {/* Role select */}
          <div className="sm:w-40 space-y-1.5">
            <Label htmlFor="invite-role">
              {labels.form.role.vi}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                ({labels.form.role.en})
              </span>
            </Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "admin" | "member")}
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  {labels.form.roleOptions.admin.vi}
                </SelectItem>
                <SelectItem value="member">
                  {labels.form.roleOptions.member.vi}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit button */}
          <Button type="submit" disabled={isSubmitting} className="sm:w-auto">
            {isSubmitting
              ? labels.form.submitting.vi
              : labels.form.submit.vi}
          </Button>
        </div>
      </form>

      {/* Pending invitations */}
      {(isLoadingInvites || pendingInvites.length > 0) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              {labels.pending.title.vi}{" "}
              <span className="text-muted-foreground font-normal">
                ({labels.pending.title.en})
              </span>
            </h3>

            {isLoadingInvites ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : pendingInvites.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {labels.pending.empty.vi}
              </p>
            ) : (
              <ul className="space-y-2">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2 text-sm"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{invite.email}</span>
                      <span className="text-muted-foreground text-xs capitalize">
                        {invite.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(invite.status)}>
                        {getStatusLabel(invite.status)}
                      </Badge>
                      {invite.status === "pending" && onRevokeInvite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(invite.id)}
                          disabled={revokingId === invite.id}
                        >
                          {revokingId === invite.id
                            ? labels.pending.revoking.vi
                            : labels.pending.revoke.vi}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
