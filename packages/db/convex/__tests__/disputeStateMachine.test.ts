/**
 * Unit tests for dispute state machine.
 * Pure function tests — no Convex runtime needed.
 *
 * vi: "Kiểm tra đơn vị máy trạng thái tranh chấp" / en: "Dispute state machine unit tests"
 */
import { describe, expect, it } from "vitest";

import type { DisputeStatus } from "../lib/disputeStateMachine";
import {
  canTransitionDispute,
  DISPUTE_TRANSITIONS,
  getNextDisputeStatuses,
} from "../lib/disputeStateMachine";

describe("DISPUTE_TRANSITIONS", () => {
  it("test_open_can_transition_to_investigating_and_escalated", () => {
    expect(DISPUTE_TRANSITIONS.open).toContain("investigating");
    expect(DISPUTE_TRANSITIONS.open).toContain("escalated");
  });

  it("test_investigating_can_transition_to_resolved_closed_escalated", () => {
    expect(DISPUTE_TRANSITIONS.investigating).toContain("resolved");
    expect(DISPUTE_TRANSITIONS.investigating).toContain("closed");
    expect(DISPUTE_TRANSITIONS.investigating).toContain("escalated");
  });

  it("test_resolved_is_terminal", () => {
    expect(DISPUTE_TRANSITIONS.resolved).toHaveLength(0);
  });

  it("test_closed_is_terminal", () => {
    expect(DISPUTE_TRANSITIONS.closed).toHaveLength(0);
  });

  it("test_escalated_is_terminal", () => {
    expect(DISPUTE_TRANSITIONS.escalated).toHaveLength(0);
  });
});

describe("canTransitionDispute", () => {
  it("test_open_to_investigating_is_valid", () => {
    expect(canTransitionDispute("open", "investigating")).toBe(true);
  });

  it("test_open_to_escalated_is_valid", () => {
    expect(canTransitionDispute("open", "escalated")).toBe(true);
  });

  it("test_open_to_resolved_is_invalid", () => {
    expect(canTransitionDispute("open", "resolved")).toBe(false);
  });

  it("test_open_to_closed_is_invalid", () => {
    expect(canTransitionDispute("open", "closed")).toBe(false);
  });

  it("test_investigating_to_resolved_is_valid", () => {
    expect(canTransitionDispute("investigating", "resolved")).toBe(true);
  });

  it("test_investigating_to_closed_is_valid", () => {
    expect(canTransitionDispute("investigating", "closed")).toBe(true);
  });

  it("test_investigating_to_escalated_is_valid", () => {
    expect(canTransitionDispute("investigating", "escalated")).toBe(true);
  });

  it("test_resolved_to_anything_is_invalid", () => {
    const allStatuses: DisputeStatus[] = [
      "open",
      "investigating",
      "resolved",
      "closed",
      "escalated",
    ];
    for (const target of allStatuses) {
      expect(canTransitionDispute("resolved", target)).toBe(false);
    }
  });

  it("test_closed_to_anything_is_invalid", () => {
    const allStatuses: DisputeStatus[] = [
      "open",
      "investigating",
      "resolved",
      "closed",
      "escalated",
    ];
    for (const target of allStatuses) {
      expect(canTransitionDispute("closed", target)).toBe(false);
    }
  });

  it("test_escalated_to_anything_is_invalid", () => {
    const allStatuses: DisputeStatus[] = [
      "open",
      "investigating",
      "resolved",
      "closed",
      "escalated",
    ];
    for (const target of allStatuses) {
      expect(canTransitionDispute("escalated", target)).toBe(false);
    }
  });

  it("test_self_transitions_are_always_invalid", () => {
    const allStatuses: DisputeStatus[] = [
      "open",
      "investigating",
      "resolved",
      "closed",
      "escalated",
    ];
    for (const status of allStatuses) {
      expect(canTransitionDispute(status, status)).toBe(false);
    }
  });
});

describe("getNextDisputeStatuses", () => {
  it("test_open_returns_investigating_and_escalated", () => {
    const next = getNextDisputeStatuses("open");
    expect(next).toContain("investigating");
    expect(next).toContain("escalated");
    expect(next).toHaveLength(2);
  });

  it("test_investigating_returns_three_options", () => {
    const next = getNextDisputeStatuses("investigating");
    expect(next).toContain("resolved");
    expect(next).toContain("closed");
    expect(next).toContain("escalated");
    expect(next).toHaveLength(3);
  });

  it("test_terminal_states_return_empty_array", () => {
    expect(getNextDisputeStatuses("resolved")).toHaveLength(0);
    expect(getNextDisputeStatuses("closed")).toHaveLength(0);
    expect(getNextDisputeStatuses("escalated")).toHaveLength(0);
  });
});
