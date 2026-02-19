"use client";

/**
 * List component for displaying all service offerings.
 *
 * WHY: Composes multiple OfferingCards into a scrollable list with empty state
 * and loading skeleton. Separates rendering concerns from data fetching, making
 * this component testable with mock data and reusable across different pages.
 */
import { PlusIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";
import { Card, CardContent } from "@medilink/ui/card";

import type { ServiceOffering } from "../types";
import { providerLabels } from "../labels";
import { OfferingCard } from "./offering-card";

interface OfferingListProps {
  offerings: ServiceOffering[];
  isLoading?: boolean;
  onEdit?: (offering: ServiceOffering) => void;
  onDelete?: (offering: ServiceOffering) => void;
  onAdd?: () => void;
  locale?: "vi" | "en";
}

/**
 * Skeleton loader for offerings — 3 animate-pulse card shapes.
 */
function OfferingListSkeleton() {
  return (
    <div className="space-y-3" data-testid="offering-list-skeleton">
      {[1, 2, 3].map((n) => (
        <Card key={n}>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="bg-muted h-6 w-24 animate-pulse rounded" />
              <div className="bg-muted h-4 w-full animate-pulse rounded" />
              <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * OfferingList renders a list of OfferingCards with empty state and
 * loading skeleton. The data-testid="offering-list" enables E2E targeting.
 */
export function OfferingList({
  offerings,
  isLoading = false,
  onEdit,
  onDelete,
  onAdd,
  locale = "vi",
}: OfferingListProps) {
  if (isLoading) {
    return <OfferingListSkeleton />;
  }

  return (
    <div data-testid="offering-list" className="space-y-4">
      {onAdd && (
        <div className="flex justify-end">
          <Button onClick={onAdd} size="sm" className="gap-1">
            <PlusIcon className="h-4 w-4" />
            {providerLabels.offerings.addOffering[locale]}
          </Button>
        </div>
      )}

      {offerings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm font-medium">
            {providerLabels.offerings.noOfferings[locale]}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {providerLabels.offerings.noOfferingsDesc[locale]}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offerings.map((offering) => (
            <OfferingCard
              key={offering._id}
              offering={offering}
              onEdit={onEdit}
              onDelete={onDelete}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
