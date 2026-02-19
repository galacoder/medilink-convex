"use client";

/**
 * Multi-region selector for provider coverage areas.
 *
 * WHY: Providers serve different geographic regions. This selector allows
 * adding multiple province/district pairs via a controlled component pattern.
 * The onChange callback returns the complete areas array for batch submission
 * via the setCoverageArea mutation (batch-replace pattern).
 */
import { PlusIcon, TrashIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";

import { providerLabels } from "../labels";

export interface CoverageAreaEntry {
  region: string;
  district?: string;
}

interface CoverageAreaSelectorProps {
  value: CoverageAreaEntry[];
  onChange: (areas: CoverageAreaEntry[]) => void;
  locale?: "vi" | "en";
}

/**
 * CoverageAreaSelector renders rows of region + district inputs,
 * allowing providers to define their geographic service coverage.
 */
export function CoverageAreaSelector({
  value,
  onChange,
  locale = "vi",
}: CoverageAreaSelectorProps) {
  function handleAddRegion() {
    onChange([...value, { region: "", district: "" }]);
  }

  function handleRemoveRegion(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleRegionChange(index: number, region: string) {
    const updated = value.map((area, i) =>
      i === index ? { ...area, region } : area,
    );
    onChange(updated);
  }

  function handleDistrictChange(index: number, district: string) {
    const updated = value.map((area, i) =>
      i === index ? { ...area, district } : area,
    );
    onChange(updated);
  }

  return (
    <div className="space-y-3" data-testid="coverage-area-selector">
      {value.length === 0 && (
        <p className="text-muted-foreground text-sm">
          {providerLabels.coverage.noCoverage[locale]}
        </p>
      )}

      {value.map((area, index) => (
        <div
          key={index}
          className="flex items-end gap-2"
          data-testid="coverage-area-row"
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`region-${index}`}>
              {providerLabels.coverage.region[locale]}
            </Label>
            <Input
              id={`region-${index}`}
              value={area.region}
              onChange={(e) => handleRegionChange(index, e.target.value)}
              placeholder={providerLabels.coverage.regionPlaceholder[locale]}
              data-testid="region-input"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`district-${index}`}>
              {providerLabels.coverage.district[locale]}
            </Label>
            <Input
              id={`district-${index}`}
              value={area.district ?? ""}
              onChange={(e) => handleDistrictChange(index, e.target.value)}
              placeholder={providerLabels.coverage.districtPlaceholder[locale]}
              data-testid="district-input"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
            onClick={() => handleRemoveRegion(index)}
            aria-label={providerLabels.coverage.removeRegion[locale]}
            data-testid="remove-region-btn"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddRegion}
        className="gap-1"
        data-testid="add-region-btn"
      >
        <PlusIcon className="h-4 w-4" />
        {providerLabels.coverage.addRegion[locale]}
      </Button>
    </div>
  );
}
