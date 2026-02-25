/**
 * Tests for payment utility functions (VND formatting, date formatting).
 *
 * AC10: VND amounts formatted with thousands separator
 *
 * vi: "Kiem tra ham tien ich thanh toan" / en: "Payment utility tests"
 */
import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, formatVnd } from "../../utils";

describe("formatVnd", () => {
  it("should format large VND amount with thousands separator", () => {
    const result = formatVnd(10800000);
    // vi-VN format: "10.800.000 ₫" or "10.800.000₫"
    expect(result).toContain("10.800.000");
    expect(result).toContain("₫");
  });

  it("should format zero amount", () => {
    const result = formatVnd(0);
    expect(result).toContain("0");
    expect(result).toContain("₫");
  });

  it("should format small amount", () => {
    const result = formatVnd(50000);
    expect(result).toContain("50.000");
    expect(result).toContain("₫");
  });

  it("should format very large amount", () => {
    const result = formatVnd(1000000000);
    expect(result).toContain("1.000.000.000");
    expect(result).toContain("₫");
  });
});

describe("formatDate", () => {
  it("should format timestamp to Vietnamese date", () => {
    // 2026-02-25 00:00:00 UTC
    const ts = new Date("2026-02-25T00:00:00Z").getTime();
    const result = formatDate(ts, "vi");
    // Vietnamese format: DD/MM/YYYY
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("should format timestamp to English date", () => {
    const ts = new Date("2026-02-25T00:00:00Z").getTime();
    const result = formatDate(ts, "en");
    // English format: MM/DD/YYYY
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe("formatDateTime", () => {
  it("should include time in output", () => {
    const ts = new Date("2026-02-25T14:30:00Z").getTime();
    const result = formatDateTime(ts, "vi");
    // Should contain both date and time portions
    expect(result.length).toBeGreaterThan(10);
  });
});
