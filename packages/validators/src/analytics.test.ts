/**
 * Tests for analytics Zod schemas.
 *
 * WHY: Validators are tested in isolation to verify that the Zod schemas
 * correctly accept valid inputs and reject invalid ones, including bilingual
 * error messages.
 *
 * vi: "Kiểm tra lược đồ phân tích" / en: "Analytics schema tests"
 */
import { describe, expect, it } from "vitest";

import {
  ANALYTICS_DATE_RANGES,
  analyticsDateRangeSchema,
  analyticsFilterSchema,
} from "./analytics";

describe("analyticsDateRangeSchema", () => {
  it("test_analyticsDateRangeSchema_acceptsValidPresets", () => {
    const validPresets = ["7d", "30d", "90d", "custom"] as const;
    for (const preset of validPresets) {
      const result = analyticsDateRangeSchema.safeParse(preset);
      expect(result.success).toBe(true);
    }
  });

  it("test_analyticsDateRangeSchema_rejectsInvalidPreset", () => {
    const result = analyticsDateRangeSchema.safeParse("1year");
    expect(result.success).toBe(false);
  });
});

describe("analyticsFilterSchema", () => {
  it("test_analyticsFilterSchema_acceptsValidPresetFilter", () => {
    const result = analyticsFilterSchema.safeParse({
      dateRange: "30d",
      providerId: "prov_abc123",
    });
    expect(result.success).toBe(true);
  });

  it("test_analyticsFilterSchema_acceptsCustomRangeWithDates", () => {
    const now = Date.now();
    const result = analyticsFilterSchema.safeParse({
      dateRange: "custom",
      startDate: now - 7 * 24 * 60 * 60 * 1000,
      endDate: now,
      providerId: "prov_abc123",
    });
    expect(result.success).toBe(true);
  });

  it("test_analyticsFilterSchema_requiresProviderIdAsString", () => {
    const result = analyticsFilterSchema.safeParse({
      dateRange: "30d",
      providerId: "",
    });
    expect(result.success).toBe(false);
  });

  it("test_analyticsFilterSchema_acceptsAllPresets", () => {
    for (const preset of ["7d", "30d", "90d"] as const) {
      const result = analyticsFilterSchema.safeParse({
        dateRange: preset,
        providerId: "prov_abc123",
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("ANALYTICS_DATE_RANGES", () => {
  it("test_ANALYTICS_DATE_RANGES_hasExpectedValues", () => {
    expect(ANALYTICS_DATE_RANGES).toHaveLength(4);
    const values = ANALYTICS_DATE_RANGES.map((r) => r.value);
    expect(values).toContain("7d");
    expect(values).toContain("30d");
    expect(values).toContain("90d");
    expect(values).toContain("custom");
  });

  it("test_ANALYTICS_DATE_RANGES_hasBilingualLabels", () => {
    for (const range of ANALYTICS_DATE_RANGES) {
      expect(range.labelVi).toBeTruthy();
      expect(range.labelEn).toBeTruthy();
    }
  });
});
