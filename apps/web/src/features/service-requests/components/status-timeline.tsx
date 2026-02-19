"use client";

/**
 * StatusTimeline component — vertical workflow progression display.
 *
 * WHY: Hospital staff need to see where a service request is in the
 * workflow at a glance. The timeline maps the state machine steps
 * (pending -> quoted -> accepted -> in_progress -> completed) to visual
 * circles + connecting lines. Cancelled/disputed are shown as terminal
 * red states at any position.
 *
 * Design: Simple CSS circles + lines, no external library needed.
 */
import type { ServiceRequestStatus } from "../types";
import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";

interface StatusTimelineProps {
  currentStatus: ServiceRequestStatus;
}

// The main workflow steps (linear progression)
const MAIN_STEPS: ServiceRequestStatus[] = [
  "pending",
  "quoted",
  "accepted",
  "in_progress",
  "completed",
];

const labels = serviceRequestLabels.timeline.steps;

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const isTerminal =
    currentStatus === "cancelled" || currentStatus === "disputed";

  // Determine the step index for the current status
  const currentStepIndex = MAIN_STEPS.indexOf(
    isTerminal ? "pending" : currentStatus,
  );

  return (
    <div className="space-y-2">
      {/* Main workflow steps */}
      <ol className="relative">
        {MAIN_STEPS.map((status, index) => {
          const isCompleted = !isTerminal && index < currentStepIndex;
          const isCurrent = !isTerminal && index === currentStepIndex;
          const isFuture = !isTerminal && index > currentStepIndex;

          return (
            <li key={status} className="flex gap-4 pb-4 last:pb-0">
              {/* Circle + connector line */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted-foreground/30 bg-background text-muted-foreground/50",
                  ].join(" ")}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                {/* Connector line (not shown after last item) */}
                {index < MAIN_STEPS.length - 1 && (
                  <div
                    className={[
                      "mt-1 h-full w-0.5 flex-1",
                      isCompleted ? "bg-primary" : "bg-muted-foreground/20",
                    ].join(" ")}
                    style={{ minHeight: "1rem" }}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="pt-1 pb-4">
                <p
                  className={[
                    "text-sm font-medium",
                    isFuture ? "text-muted-foreground/50" : "text-foreground",
                  ].join(" ")}
                >
                  {labels[status].label.vi}
                </p>
                <p
                  className={[
                    "mt-0.5 text-xs",
                    isFuture
                      ? "text-muted-foreground/40"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  {labels[status].description.vi}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Terminal states (cancelled / disputed) */}
      {isTerminal && (
        <div className="border-destructive/30 bg-destructive/10 flex items-start gap-4 rounded-md border p-3">
          <div className="bg-destructive flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
            !
          </div>
          <div>
            <p className="text-destructive text-sm font-medium">
              {labels[currentStatus].label.vi}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {labels[currentStatus].description.vi}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
