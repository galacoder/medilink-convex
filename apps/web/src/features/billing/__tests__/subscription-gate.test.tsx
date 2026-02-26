/**
 * Tests for SubscriptionGate component.
 *
 * WHY: Verifies the gate component correctly enables/disables/hides
 * children based on subscription status (active, grace_period,
 * expired, suspended).
 *
 * vi: "Kiem tra thanh phan SubscriptionGate"
 * en: "Tests for SubscriptionGate component"
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubscriptionGate } from "../components/subscription-gate";

describe("SubscriptionGate", () => {
  // AC8: SubscriptionGate disables mutation buttons in grace_period

  it("renders children normally for active status", () => {
    render(
      <SubscriptionGate status="active">
        <button>Add Equipment</button>
      </SubscriptionGate>,
    );
    const btn = screen.getByRole("button", { name: "Add Equipment" });
    expect(btn).toBeInTheDocument();
    // Should NOT be in a disabled wrapper
    expect(btn.closest("[data-disabled]")).toBeNull();
  });

  it("renders children normally for trial status", () => {
    render(
      <SubscriptionGate status="trial">
        <button>Create Task</button>
      </SubscriptionGate>,
    );
    expect(
      screen.getByRole("button", { name: "Create Task" }),
    ).toBeInTheDocument();
  });

  it("disables children for grace_period status", () => {
    render(
      <SubscriptionGate status="grace_period">
        <button>Add Equipment</button>
      </SubscriptionGate>,
    );
    // The wrapper div should have pointer-events-none and opacity-50
    const wrapper = screen.getByTestId("subscription-gate-disabled");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).toContain("pointer-events-none");
    expect(wrapper.className).toContain("opacity-50");
  });

  // AC10: Tooltip explains "read-only during grace period" on disabled buttons

  it("shows tooltip text for grace_period status", () => {
    render(
      <SubscriptionGate status="grace_period">
        <button>Add Equipment</button>
      </SubscriptionGate>,
    );
    // Tooltip content should be in the DOM (aria-describedby or similar)
    expect(
      screen.getByText(/Chi doc trong thoi gian gia han/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Read-only during grace period/),
    ).toBeInTheDocument();
  });

  // AC9: SubscriptionGate hides mutation buttons for expired/suspended

  it("hides children for expired status", () => {
    render(
      <SubscriptionGate status="expired">
        <button>Add Equipment</button>
      </SubscriptionGate>,
    );
    expect(
      screen.queryByRole("button", { name: "Add Equipment" }),
    ).not.toBeInTheDocument();
  });

  it("hides children for suspended status", () => {
    render(
      <SubscriptionGate status="suspended">
        <button>Create Task</button>
      </SubscriptionGate>,
    );
    expect(
      screen.queryByRole("button", { name: "Create Task" }),
    ).not.toBeInTheDocument();
  });

  it("renders custom fallback for expired status", () => {
    render(
      <SubscriptionGate
        status="expired"
        fallback={<span>Subscription required</span>}
      >
        <button>Add Equipment</button>
      </SubscriptionGate>,
    );
    expect(screen.getByText("Subscription required")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Equipment" }),
    ).not.toBeInTheDocument();
  });
});
