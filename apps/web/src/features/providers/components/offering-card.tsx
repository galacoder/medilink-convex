"use client";

/**
 * Card component for displaying a single service offering.
 *
 * WHY: Provider admins need a compact view of each offering's key details
 * (specialty, description, price, turnaround) with quick action buttons for
 * edit and delete. Supports bilingual display based on locale prop.
 */
import { PencilIcon, TrashIcon } from "lucide-react";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";
import { Card, CardContent, CardHeader } from "@medilink/ui/card";

import type { ServiceOffering } from "../types";
import { SPECIALTY_LABELS } from "../types";
import { providerLabels } from "../labels";

interface OfferingCardProps {
  offering: ServiceOffering;
  onEdit?: (offering: ServiceOffering) => void;
  onDelete?: (offering: ServiceOffering) => void;
  /** Display locale: Vietnamese (primary) or English */
  locale?: "vi" | "en";
}

/**
 * Returns a color class for the specialty badge.
 */
function getSpecialtyBadgeVariant(
  specialty: string,
): "default" | "secondary" | "outline" {
  switch (specialty) {
    case "calibration":
    case "diagnostics":
      return "default";
    case "general_repair":
    case "electrical":
    case "software":
      return "secondary";
    default:
      return "outline";
  }
}

/**
 * Formats a price in VND with thousands separators.
 */
function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + " VND";
}

/**
 * OfferingCard displays a single service offering with specialty badge,
 * bilingual description, optional price estimate, and edit/delete actions.
 */
export function OfferingCard({
  offering,
  onEdit,
  onDelete,
  locale = "vi",
}: OfferingCardProps) {
  // SPECIALTY_LABELS is Record<Specialty, {vi: string, en: string}> -- lookup
  // is always defined since offering.specialty is typed as Specialty.
  const specialtyLabel = SPECIALTY_LABELS[offering.specialty][locale];

  const description =
    locale === "vi" ? offering.descriptionVi : offering.descriptionEn;

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Badge
              variant={getSpecialtyBadgeVariant(offering.specialty)}
              data-testid="specialty-badge"
            >
              {specialtyLabel}
            </Badge>
          </div>
          <div className="flex shrink-0 gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onEdit(offering)}
                aria-label={providerLabels.actions.edit[locale]}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(offering)}
                aria-label={providerLabels.actions.delete[locale]}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-xs">
          {offering.priceEstimate !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">
                {providerLabels.offerings.priceEstimate[locale]}:
              </span>
              <span className="font-medium">
                {formatPrice(offering.priceEstimate)}
              </span>
            </div>
          )}

          {offering.turnaroundDays !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">
                {providerLabels.offerings.turnaroundDays[locale]}:
              </span>
              <span className="font-medium">
                {offering.turnaroundDays}{" "}
                {locale === "vi" ? "ngày" : "days"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
