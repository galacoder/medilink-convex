"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown } from "lucide-react";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@medilink/ui/dropdown-menu";

import {
  organization,
  useActiveOrganization,
  useListOrganizations,
} from "~/auth/client";

interface OrgSwitcherProps {
  /** Current portal type — used to detect cross-portal switches */
  currentPortal?: "hospital" | "provider" | "admin";
}

/**
 * Organization switcher for users belonging to multiple organizations.
 *
 * WHY: Users can belong to both a hospital org and a provider org.
 * The switcher allows them to change their active organization context.
 * When switching to an org of a different type (hospital -> provider),
 * the user is redirected to the correct portal dashboard.
 *
 * Renders:
 * - Single org: org name as plain text (no dropdown)
 * - Multi org: dropdown with all orgs + type badges
 */
export function OrgSwitcher({ currentPortal }: OrgSwitcherProps) {
  const router = useRouter();
  const { data: activeOrg, isPending: activeOrgPending } =
    useActiveOrganization();
  const { data: orgs, isPending: orgsPending } = useListOrganizations();

  const [isSwitching, setIsSwitching] = useState(false);

  const isLoading = activeOrgPending || orgsPending;

  if (isLoading) {
    return (
      <span className="text-muted-foreground bg-muted h-5 w-32 animate-pulse rounded text-sm" />
    );
  }

  const orgList = orgs ?? [];

  // Single org: render org name as plain text (no dropdown needed)
  if (orgList.length <= 1) {
    return <span className="text-sm font-medium">{activeOrg?.name ?? ""}</span>;
  }

  // Multi-org: render dropdown switcher
  async function handleSwitch(orgId: string, orgType?: string) {
    if (orgId === activeOrg?.id || isSwitching) return;

    setIsSwitching(true);
    try {
      await organization.setActive({ organizationId: orgId });

      // Determine if the new org is a different portal type
      // WHY: A user switching from a hospital org to a provider org
      // must be redirected to /provider/dashboard (wrong portal context)
      const newOrgType = orgType as "hospital" | "provider" | undefined;
      if (newOrgType && newOrgType !== currentPortal) {
        router.push(`/${newOrgType}/dashboard`);
      } else {
        // Same portal type — refresh to update org context in all queries
        router.refresh();
      }
    } catch {
      // Silently fail — user stays on current org
    } finally {
      setIsSwitching(false);
    }
  }

  function getOrgTypeBadge(orgMetadata: Record<string, unknown> | undefined) {
    const orgType = orgMetadata?.org_type as string | undefined;
    if (!orgType) return null;

    const labels: Record<
      string,
      { vi: string; variant: "default" | "secondary" | "outline" }
    > = {
      hospital: { vi: "Bệnh viện", variant: "default" },
      provider: { vi: "Nhà cung cấp", variant: "secondary" },
    };

    const label = labels[orgType];
    if (!label) return null;

    return (
      <Badge variant={label.variant} className="ml-1 text-xs">
        {label.vi}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2"
          disabled={isSwitching}
          aria-label="Chuyển đổi tổ chức (Switch organization)"
        >
          <Building2 className="h-4 w-4" />
          <span className="max-w-32 truncate text-sm font-medium">
            {activeOrg?.name ?? "Tổ chức"}
          </span>
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Chuyển đổi tổ chức{/* Switch organization */}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {orgList.map((org) => {
          const isActive = org.id === activeOrg?.id;
          const orgMetadata = (org as { metadata?: Record<string, unknown> })
            .metadata;

          return (
            <DropdownMenuItem
              key={org.id}
              onClick={() =>
                handleSwitch(org.id, orgMetadata?.org_type as string)
              }
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="truncate">{org.name}</span>
                {getOrgTypeBadge(orgMetadata)}
              </div>
              {isActive && (
                <Check className="text-primary ml-2 h-4 w-4 shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
