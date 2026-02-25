/**
 * Tests for getBalanceState pure logic function.
 *
 * WHY: Verifies color-coded balance states map correctly to remaining
 * percentage thresholds: healthy (>50%), warning (20-50%), critical (<20%),
 * empty (0%).
 *
 * vi: "Kiem tra ham getBalanceState" / en: "Tests for getBalanceState"
 */
import { describe, expect, it } from "vitest";

import { getBalanceState } from "../lib/credit-balance-state";

describe("getBalanceState", () => {
  // AC2: Progress bar color changes based on remaining percentage

  it("returns 'healthy' for >50% remaining", () => {
    const state = getBalanceState(75);
    expect(state.level).toBe("healthy");
    expect(state.textClass).toContain("emerald");
    expect(state.barClass).toContain("emerald");
    expect(state.icon).toBeNull();
  });

  it("returns 'healthy' for exactly 51% remaining", () => {
    const state = getBalanceState(51);
    expect(state.level).toBe("healthy");
  });

  it("returns 'warning' for exactly 50% remaining", () => {
    const state = getBalanceState(50);
    expect(state.level).toBe("warning");
    expect(state.textClass).toContain("amber");
    expect(state.barClass).toContain("amber");
    expect(state.icon).toBe("AlertTriangle");
  });

  it("returns 'warning' for 35% remaining", () => {
    const state = getBalanceState(35);
    expect(state.level).toBe("warning");
  });

  it("returns 'warning' for exactly 20% remaining", () => {
    const state = getBalanceState(20);
    expect(state.level).toBe("warning");
  });

  it("returns 'critical' for 19% remaining", () => {
    const state = getBalanceState(19);
    expect(state.level).toBe("critical");
    expect(state.textClass).toContain("red");
    expect(state.barClass).toContain("red");
    expect(state.icon).toBe("AlertTriangle");
  });

  it("returns 'critical' for 1% remaining", () => {
    const state = getBalanceState(1);
    expect(state.level).toBe("critical");
  });

  it("returns 'empty' for exactly 0% remaining", () => {
    const state = getBalanceState(0);
    expect(state.level).toBe("empty");
    expect(state.textClass).toContain("red");
    expect(state.textClass).toContain("font-bold");
    expect(state.barClass).toContain("red");
    expect(state.icon).toBe("XCircle");
  });

  it("returns 'empty' for negative remaining", () => {
    const state = getBalanceState(-10);
    expect(state.level).toBe("empty");
  });

  it("returns 'healthy' for 100% remaining", () => {
    const state = getBalanceState(100);
    expect(state.level).toBe("healthy");
  });
});
