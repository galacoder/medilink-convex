"use client";

/**
 * Web Vitals Tracking Component.
 *
 * WHY: Core Web Vitals (LCP, FID, CLS, TTFB, INP) directly impact user
 * experience and search ranking. Tracking these in production allows the
 * operations team to detect performance regressions before they affect
 * all users. This component uses the Next.js built-in `useReportWebVitals`
 * hook which captures real user performance data — not synthetic benchmarks.
 *
 * Metrics are sent to Sentry when configured (NEXT_PUBLIC_SENTRY_DSN is set).
 * In development, metrics are logged to the console for debugging.
 *
 * Alert thresholds (per AC-3):
 *   - LCP > 2500ms (Good: <2500ms, Needs Improvement: 2500-4000ms, Poor: >4000ms)
 *   - FID > 100ms (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
 *   - CLS > 0.1 (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
 */
import { useReportWebVitals } from "next/web-vitals";

type MetricName = "TTFB" | "FCP" | "LCP" | "FID" | "CLS" | "INP";

interface WebVitalMetric {
  id: string;
  name: MetricName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType: string;
}

/**
 * Alert thresholds for key Web Vitals.
 * Values are in milliseconds for time-based metrics, unitless for CLS.
 * Thresholds from: https://web.dev/vitals/
 */
const ALERT_THRESHOLDS: Partial<Record<MetricName, number>> = {
  LCP: 2500,
  FID: 100,
  CLS: 0.1,
  INP: 200,
  TTFB: 800,
};

function reportVital(metric: WebVitalMetric) {
  // In development — log to console for debugging performance issues
  if (process.env.NODE_ENV === "development") {
    const isAboveThreshold =
      ALERT_THRESHOLDS[metric.name] !== undefined &&
      metric.value > (ALERT_THRESHOLDS[metric.name] ?? Infinity);

    const prefix = isAboveThreshold ? "[WARN]" : "[INFO]";
    console.log(
      `${prefix} Web Vital: ${metric.name} = ${metric.value.toFixed(2)} (${metric.rating})`,
    );
    return;
  }

  // In production — send to analytics endpoint if configured
  // WHY: navigator.sendBeacon is preferred over fetch for analytics because
  // it completes even if the page is being closed, ensuring no data loss.
  const body = JSON.stringify({
    name: metric.name,
    value: Math.round(
      metric.name === "CLS" ? metric.value * 1000 : metric.value,
    ),
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Send to Sentry performance monitoring if DSN is configured.
  // WHY: We check for window.__SENTRY__ (the Sentry global) rather than
  // importing @sentry/nextjs directly. This avoids a hard dependency on
  // the Sentry package — it only runs when Sentry is actually loaded.
  // Teams can enable Sentry monitoring without changing this file.
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SENTRY_DSN &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (window as any).__SENTRY__ !== "undefined"
  ) {
    try {
      // Access Sentry via the global object to avoid a hard compile-time dependency.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sentry = (window as any).__SENTRY__ as {
        hub?: { captureEvent?: (event: Record<string, unknown>) => void };
      };
      sentry.hub?.captureEvent?.({
        type: "transaction",
        tags: {
          "web.vital.name": metric.name,
          "web.vital.rating": metric.rating,
        },
        measurements: {
          [metric.name.toLowerCase()]: {
            value: metric.value,
            unit: metric.name === "CLS" ? "none" : "millisecond",
          },
        },
      });
    } catch {
      // Sentry reporting errors should never break the application
    }
  }

  // Send to custom analytics endpoint via beacon (non-blocking)
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/vitals", body);
  }
}

/**
 * WebVitals — renders nothing, only hooks into the Next.js performance API.
 * Place this component in the root layout to collect metrics on all pages.
 *
 * Example usage in app/layout.tsx:
 *   import { WebVitals } from "~/components/web-vitals";
 *   // In RootLayout body: <WebVitals />
 */
export function WebVitals() {
  useReportWebVitals(reportVital as Parameters<typeof useReportWebVitals>[0]);
  return null;
}
