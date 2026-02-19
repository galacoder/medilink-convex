/**
 * Unit tests for the service request workflow state machine.
 * TDD: tests written before implementation to define expected behavior.
 *
 * State machine:
 *   pending -> quoted | cancelled
 *   quoted -> accepted | cancelled
 *   accepted -> in_progress | cancelled
 *   in_progress -> completed | disputed
 *   completed -> disputed
 *   cancelled -> (terminal)
 *   disputed -> (terminal)
 */

import { describe, expect, it } from "vitest";

import type { QuoteStatus, ServiceRequestStatus } from "./workflowStateMachine";
import {
  canTransition,
  canTransitionQuote,
  getNextStatuses,
  VALID_QUOTE_TRANSITIONS,
  VALID_TRANSITIONS,
} from "./workflowStateMachine";

describe("workflowStateMachine - ServiceRequest", () => {
  describe("VALID_TRANSITIONS map", () => {
    it("should define transitions for all 7 service request statuses", () => {
      const statuses: ServiceRequestStatus[] = [
        "pending",
        "quoted",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ];
      for (const status of statuses) {
        expect(VALID_TRANSITIONS).toHaveProperty(status);
      }
    });
  });

  describe("canTransition()", () => {
    // Valid forward transitions
    it("canTransition('pending', 'quoted') returns true", () => {
      expect(canTransition("pending", "quoted")).toBe(true);
    });

    it("canTransition('pending', 'cancelled') returns true", () => {
      expect(canTransition("pending", "cancelled")).toBe(true);
    });

    it("canTransition('quoted', 'accepted') returns true", () => {
      expect(canTransition("quoted", "accepted")).toBe(true);
    });

    it("canTransition('quoted', 'cancelled') returns true", () => {
      expect(canTransition("quoted", "cancelled")).toBe(true);
    });

    it("canTransition('accepted', 'in_progress') returns true", () => {
      expect(canTransition("accepted", "in_progress")).toBe(true);
    });

    it("canTransition('accepted', 'cancelled') returns true", () => {
      expect(canTransition("accepted", "cancelled")).toBe(true);
    });

    it("canTransition('in_progress', 'completed') returns true", () => {
      expect(canTransition("in_progress", "completed")).toBe(true);
    });

    it("canTransition('in_progress', 'disputed') returns true", () => {
      expect(canTransition("in_progress", "disputed")).toBe(true);
    });

    it("canTransition('completed', 'disputed') returns true", () => {
      expect(canTransition("completed", "disputed")).toBe(true);
    });

    // Invalid transitions - backward or skipped
    it("canTransition('pending', 'completed') returns false", () => {
      expect(canTransition("pending", "completed")).toBe(false);
    });

    it("canTransition('pending', 'in_progress') returns false", () => {
      expect(canTransition("pending", "in_progress")).toBe(false);
    });

    it("canTransition('pending', 'accepted') returns false", () => {
      expect(canTransition("pending", "accepted")).toBe(false);
    });

    it("canTransition('pending', 'disputed') returns false", () => {
      expect(canTransition("pending", "disputed")).toBe(false);
    });

    it("canTransition('quoted', 'in_progress') returns false", () => {
      expect(canTransition("quoted", "in_progress")).toBe(false);
    });

    it("canTransition('quoted', 'completed') returns false", () => {
      expect(canTransition("quoted", "completed")).toBe(false);
    });

    it("canTransition('completed', 'cancelled') returns false", () => {
      expect(canTransition("completed", "cancelled")).toBe(false);
    });

    it("canTransition('completed', 'pending') returns false", () => {
      expect(canTransition("completed", "pending")).toBe(false);
    });

    it("canTransition('completed', 'in_progress') returns false", () => {
      expect(canTransition("completed", "in_progress")).toBe(false);
    });

    // Terminal states
    it("canTransition('cancelled', 'pending') returns false (terminal)", () => {
      expect(canTransition("cancelled", "pending")).toBe(false);
    });

    it("canTransition('cancelled', 'quoted') returns false (terminal)", () => {
      expect(canTransition("cancelled", "quoted")).toBe(false);
    });

    it("canTransition('cancelled', 'in_progress') returns false (terminal)", () => {
      expect(canTransition("cancelled", "in_progress")).toBe(false);
    });

    it("canTransition('disputed', 'completed') returns false (terminal)", () => {
      expect(canTransition("disputed", "completed")).toBe(false);
    });

    it("canTransition('disputed', 'in_progress') returns false (terminal)", () => {
      expect(canTransition("disputed", "in_progress")).toBe(false);
    });

    // Self-transitions should be invalid
    it("canTransition('pending', 'pending') returns false (self-transition)", () => {
      expect(canTransition("pending", "pending")).toBe(false);
    });

    it("canTransition('in_progress', 'in_progress') returns false (self-transition)", () => {
      expect(canTransition("in_progress", "in_progress")).toBe(false);
    });
  });

  describe("getNextStatuses()", () => {
    it("getNextStatuses('pending') returns ['quoted', 'cancelled']", () => {
      expect(getNextStatuses("pending")).toEqual(["quoted", "cancelled"]);
    });

    it("getNextStatuses('quoted') returns ['accepted', 'cancelled']", () => {
      expect(getNextStatuses("quoted")).toEqual(["accepted", "cancelled"]);
    });

    it("getNextStatuses('accepted') returns ['in_progress', 'cancelled']", () => {
      expect(getNextStatuses("accepted")).toEqual(["in_progress", "cancelled"]);
    });

    it("getNextStatuses('in_progress') returns ['completed', 'disputed']", () => {
      expect(getNextStatuses("in_progress")).toEqual(["completed", "disputed"]);
    });

    it("getNextStatuses('completed') returns ['disputed']", () => {
      expect(getNextStatuses("completed")).toEqual(["disputed"]);
    });

    it("getNextStatuses('cancelled') returns [] (terminal)", () => {
      expect(getNextStatuses("cancelled")).toEqual([]);
    });

    it("getNextStatuses('disputed') returns [] (terminal)", () => {
      expect(getNextStatuses("disputed")).toEqual([]);
    });
  });
});

describe("workflowStateMachine - Quote", () => {
  describe("VALID_QUOTE_TRANSITIONS map", () => {
    it("should define transitions for all 4 quote statuses", () => {
      const statuses: QuoteStatus[] = [
        "pending",
        "accepted",
        "rejected",
        "expired",
      ];
      for (const status of statuses) {
        expect(VALID_QUOTE_TRANSITIONS).toHaveProperty(status);
      }
    });
  });

  describe("canTransitionQuote()", () => {
    // Valid transitions
    it("canTransitionQuote('pending', 'accepted') returns true", () => {
      expect(canTransitionQuote("pending", "accepted")).toBe(true);
    });

    it("canTransitionQuote('pending', 'rejected') returns true", () => {
      expect(canTransitionQuote("pending", "rejected")).toBe(true);
    });

    it("canTransitionQuote('pending', 'expired') returns true", () => {
      expect(canTransitionQuote("pending", "expired")).toBe(true);
    });

    // Terminal states
    it("canTransitionQuote('accepted', 'rejected') returns false (terminal)", () => {
      expect(canTransitionQuote("accepted", "rejected")).toBe(false);
    });

    it("canTransitionQuote('accepted', 'expired') returns false (terminal)", () => {
      expect(canTransitionQuote("accepted", "expired")).toBe(false);
    });

    it("canTransitionQuote('rejected', 'pending') returns false (terminal)", () => {
      expect(canTransitionQuote("rejected", "pending")).toBe(false);
    });

    it("canTransitionQuote('expired', 'pending') returns false (terminal)", () => {
      expect(canTransitionQuote("expired", "pending")).toBe(false);
    });

    // Self-transitions
    it("canTransitionQuote('pending', 'pending') returns false (self-transition)", () => {
      expect(canTransitionQuote("pending", "pending")).toBe(false);
    });
  });
});
