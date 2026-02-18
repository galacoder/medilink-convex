"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@medilink/ui/alert-dialog";
import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@medilink/ui/select";
import { Skeleton } from "@medilink/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@medilink/ui/tooltip";

import { settingsLabels } from "~/lib/i18n/settings-labels";

export type OrgRole = "owner" | "admin" | "member";

export interface OrgMember {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  joinedAt?: number;
}

interface MembersTableProps {
  members: OrgMember[];
  isLoading?: boolean;
  /** The current user's role — controls which actions are available */
  callerRole: OrgRole;
  /** The current user's ID — prevents self-removal */
  callerId: string;
  /** Total number of owners — prevents removing the last owner */
  ownerCount?: number;
  onChangeRole?: (userId: string, newRole: OrgRole) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
}

/**
 * Organization members table with reactive data and role management.
 *
 * WHY: The members table must be reactive (real-time updates when members
 * join/leave). Role changes and removals are protected by the permission
 * matrix: owner > admin > member. The last owner cannot be removed.
 *
 * Action visibility:
 *   - Owner: can change any member role, remove any member (not last owner)
 *   - Admin: can remove members only (not other admins or owners)
 *   - Member: read-only view
 */
export function MembersTable({
  members,
  isLoading = false,
  callerRole,
  callerId,
  ownerCount = 1,
  onChangeRole,
  onRemoveMember,
}: MembersTableProps) {
  const labels = settingsLabels.members;
  const [pendingRoleChange, setPendingRoleChange] = useState<string | null>(
    null,
  );
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  function canChangeRole(target: OrgMember): boolean {
    if (target.userId === callerId) return false; // Cannot change own role
    if (callerRole === "owner") return true;
    if (callerRole === "admin") return target.role === "member";
    return false;
  }

  function canRemoveMember(target: OrgMember): boolean {
    if (target.userId === callerId) return false; // Cannot remove self
    if (callerRole === "owner") return true;
    if (callerRole === "admin") return target.role === "member";
    return false;
  }

  function isLastOwner(target: OrgMember): boolean {
    return target.role === "owner" && ownerCount <= 1;
  }

  async function handleRoleChange(userId: string, newRole: OrgRole) {
    if (!onChangeRole) return;
    setPendingRoleChange(userId);
    try {
      await onChangeRole(userId, newRole);
    } finally {
      setPendingRoleChange(null);
    }
  }

  async function handleRemove(userId: string) {
    if (!onRemoveMember) return;
    setPendingRemoval(userId);
    try {
      await onRemoveMember(userId);
    } finally {
      setPendingRemoval(null);
    }
  }

  function getRoleBadgeVariant(
    role: OrgRole,
  ): "default" | "secondary" | "outline" {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "member":
        return "outline";
    }
  }

  function getRoleLabel(role: OrgRole): string {
    return labels.roles[role].vi;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-6 py-10 text-center text-sm">
        {labels.empty.vi}
      </p>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-hidden rounded-md border">
        {/* Table header */}
        <div className="bg-muted/50 text-muted-foreground grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-3 text-xs font-medium tracking-wide uppercase">
          <span>{labels.table.name.vi}</span>
          <span className="hidden sm:block">{labels.table.email.vi}</span>
          <span>{labels.table.role.vi}</span>
          <span className="sr-only">{labels.table.actions.vi}</span>
        </div>

        {/* Table rows */}
        <ul className="divide-y">
          {members.map((member) => {
            const isCurrentUser = member.userId === callerId;
            const lastOwner = isLastOwner(member);
            const canChange = canChangeRole(member) && !!onChangeRole;
            const canRemove =
              canRemoveMember(member) && !lastOwner && !!onRemoveMember;

            return (
              <li
                key={member.membershipId}
                className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 px-4 py-3 text-sm"
              >
                {/* Name */}
                <div>
                  <span className="font-medium">{member.name}</span>
                  {isCurrentUser && (
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      (bạn)
                    </span>
                  )}
                  {/* Email on mobile */}
                  <p className="text-muted-foreground truncate text-xs sm:hidden">
                    {member.email}
                  </p>
                </div>

                {/* Email (desktop) */}
                <span className="text-muted-foreground hidden truncate sm:block">
                  {member.email}
                </span>

                {/* Role badge / select */}
                <div>
                  {canChange ? (
                    <Select
                      value={member.role}
                      onValueChange={(v) =>
                        handleRoleChange(member.userId, v as OrgRole)
                      }
                      disabled={pendingRoleChange === member.userId}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">
                          {labels.roles.owner.vi}
                        </SelectItem>
                        <SelectItem value="admin">
                          {labels.roles.admin.vi}
                        </SelectItem>
                        <SelectItem value="member">
                          {labels.roles.member.vi}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                  )}
                </div>

                {/* Remove action */}
                <div>
                  {lastOwner ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="text-destructive hover:text-destructive"
                        >
                          {labels.actions.remove.vi}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{labels.tooltips.lastOwner.vi}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : canRemove ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={pendingRemoval === member.userId}
                        >
                          {pendingRemoval === member.userId
                            ? labels.actions.removingMember.vi
                            : labels.actions.remove.vi}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {labels.actions.removeConfirmTitle.vi}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {labels.actions.removeConfirmDesc.vi}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {labels.actions.removeCancel.vi}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(member.userId)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {labels.actions.removeConfirm.vi}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </TooltipProvider>
  );
}
