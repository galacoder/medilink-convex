"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Skeleton } from "@medilink/ui/skeleton";

import type { OrgMember, OrgRole } from "~/components/members-table";
import { organization, useActiveOrganization } from "~/auth/client";
import { InviteMemberForm } from "~/components/forms/invite-member-form";
import { MembersTable } from "~/components/members-table";
import { settingsLabels } from "~/lib/i18n/settings-labels";

/**
 * Provider members management page.
 *
 * WHY: Provider owners and admins need to manage their team members.
 * The structure mirrors the hospital members page but is scoped
 * to the provider portal.
 */
export default function ProviderMembersPage() {
  const { data: activeOrg, isPending } = useActiveOrganization();
  const labels = settingsLabels.members;

  // Map Better Auth members to our OrgMember shape
  const members: OrgMember[] = (activeOrg?.members ?? []).map((m) => ({
    membershipId: m.id,
    userId: m.userId,
    name: (m as { user?: { name?: string } }).user?.name ?? m.userId,
    email: (m as { user?: { email?: string } }).user?.email ?? "",
    role: m.role as OrgRole,
    joinedAt: undefined,
  }));

  const ownerCount = members.filter((m) => m.role === "owner").length;
  const callerRole: OrgRole = "member";
  const callerId = "";

  async function handleInvite(email: string, role: "admin" | "member") {
    if (!activeOrg?.id) {
      throw new Error("Không tìm thấy tổ chức (Organization not found)");
    }

    // WHY: Better Auth organization plugin exposes inviteMembers() directly on
    // the client, replacing the removed tRPC organization.inviteMember procedure.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const result = await (organization as any).inviteMembers({
      organizationId: activeOrg.id,
      invitees: [{ email, role }],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (result.error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      throw new Error(result.error.message ?? settingsLabels.invite.error.vi);
    }
  }

  async function handleChangeRole(userId: string, newRole: OrgRole) {
    if (!activeOrg?.id) return;

    const response = await fetch("/api/convex/organizations/updateMemberRole", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId: activeOrg.id,
        targetUserId: userId,
        role: newRole,
      }),
    });

    if (!response.ok) {
      throw new Error(settingsLabels.members.error.roleChange.vi);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!activeOrg?.id) return;

    const response = await fetch("/api/convex/organizations/removeMember", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId: activeOrg.id,
        targetUserId: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(settingsLabels.members.error.remove.vi);
    }
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">{labels.title.vi}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {labels.subtitle.vi}
        </p>
      </div>

      {/* Invite member section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {settingsLabels.invite.title.vi}
          </CardTitle>
          <CardDescription>{settingsLabels.invite.subtitle.vi}</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm onInvite={handleInvite} />
        </CardContent>
      </Card>

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{labels.title.vi}</CardTitle>
          <CardDescription>{members.length} thành viên</CardDescription>
        </CardHeader>
        <CardContent>
          <MembersTable
            members={members}
            isLoading={isPending}
            callerRole={callerRole}
            callerId={callerId}
            ownerCount={ownerCount}
            onChangeRole={handleChangeRole}
            onRemoveMember={handleRemoveMember}
          />
        </CardContent>
      </Card>
    </div>
  );
}
