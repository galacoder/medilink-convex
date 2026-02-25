/**
 * Tests for useSubscriptionStatus hook.
 *
 * WHY: Verifies that the hook correctly derives subscription state
 * (isActive, isReadOnly, isBlocked, daysUntilExpiry) from org data
 * for all 5 subscription statuses.
 *
 * vi: "Kiem tra hook useSubscriptionStatus"
 * en: "Tests for useSubscriptionStatus hook"
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { OrgSubscriptionData } from "../hooks/use-subscription-status";
import { useSubscriptionStatus } from "../hooks/use-subscription-status";

describe("useSubscriptionStatus", () => {
  // AC12: useSubscriptionStatus hook returns correct state for all statuses

  it("returns isActive=true for active status", () => {
    const org: OrgSubscriptionData = {
      status: "active",
      subscriptionPlan: "professional",
      subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      gracePeriodEndsAt: undefined,
    };

    const { result } = renderHook(() => useSubscriptionStatus(org));

    expect(result.current.status).toBe("active");
    expect(result.current.isActive).toBe(true);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.isBlocked).toBe(false);
    expect(result.current.plan).toBe("professional");
  });

  it("returns isActive=true for trial status", () => {
    const org: OrgSubscriptionData = {
      status: "trial",
      subscriptionPlan: "trial",
      subscriptionExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      gracePeriodEndsAt: undefined,
    };

    const { result } = renderHook(() => useSubscriptionStatus(org));

    expect(result.current.status).toBe("trial");
    expect(result.current.isActive).toBe(true);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.isBlocked).toBe(false);
  });

  it("returns isReadOnly=true for grace_period status", () => {
    const gracePeriodEndsAt = Date.now() + 3 * 24 * 60 * 60 * 1000;
    const org: OrgSubscriptionData = {
      status: "grace_period",
      subscriptionPlan: "professional",
      subscriptionExpiresAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      gracePeriodEndsAt,
    };

    const { result } = renderHook(() => useSubscriptionStatus(org));

    expect(result.current.status).toBe("grace_period");
    expect(result.current.isActive).toBe(false);
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.isBlocked).toBe(false);
    expect(result.current.gracePeriodEndsAt).toBe(gracePeriodEndsAt);
  });

  it("returns isBlocked=true for expired status", () => {
    const org: OrgSubscriptionData = {
      status: "expired",
      subscriptionPlan: "professional",
      subscriptionExpiresAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      gracePeriodEndsAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    };

    const { result } = renderHook(() => useSubscriptionStatus(org));

    expect(result.current.status).toBe("expired");
    expect(result.current.isActive).toBe(false);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.isBlocked).toBe(true);
  });

  it("returns isBlocked=true for suspended status", () => {
    const org: OrgSubscriptionData = {
      status: "suspended",
      subscriptionPlan: "enterprise",
      subscriptionExpiresAt: undefined,
      gracePeriodEndsAt: undefined,
    };

    const { result } = renderHook(() => useSubscriptionStatus(org));

    expect(result.current.status).toBe("suspended");
    expect(result.current.isActive).toBe(false);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.isBlocked).toBe(true);
  });

  it("calculates daysUntilExpiry correctly", () => {
    const daysFromNow = 15;
    const expiresAt = Date.now() + daysFromNow * 24 * 60 * 60 * 1000;
    const org: OrgSubscriptionData = {
      status: "active",
      subscriptionPlan: "professional",
      subscriptionExpiresAt: expiresAt,
      gracePeriodEndsAt: undefined,
    };

    const { result } = renderHook(() => useSubscriptionStatus(org));

    expect(result.current.daysUntilExpiry).toBe(daysFromNow);
  });

  it("returns daysUntilExpiry=null when no expiresAt", () => {
    const org: OrgSubscriptionData = {
      status: "active",
      subscriptionPlan: "enterprise",
      subscriptionExpiresAt: undefined,
      gracePeriodEndsAt: undefined,
    };

    const { result } = renderHook(() => useSubscriptionStatus(org));

    expect(result.current.daysUntilExpiry).toBeNull();
  });

  it("defaults to expired when org is null", () => {
    const { result } = renderHook(() => useSubscriptionStatus(null));

    expect(result.current.status).toBe("expired");
    expect(result.current.isActive).toBe(false);
    expect(result.current.isBlocked).toBe(true);
  });

  it("treats undefined status as active (legacy orgs)", () => {
    const org: OrgSubscriptionData = {
      status: undefined,
      subscriptionPlan: undefined,
      subscriptionExpiresAt: undefined,
      gracePeriodEndsAt: undefined,
    };

    const { result } = renderHook(() => useSubscriptionStatus(org));

    // Legacy orgs without status are treated as active per billing guard logic
    expect(result.current.status).toBe("active");
    expect(result.current.isActive).toBe(true);
  });
});
