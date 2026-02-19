/**
 * Health check endpoint for production monitoring and smoke tests.
 *
 * WHY: Production monitoring tools (uptime checks, load balancers) call
 * this endpoint to verify the application is running correctly. The response
 * includes service connectivity checks so operations can quickly identify
 * which component is failing — the app itself or its dependencies.
 *
 * Returns 200 on healthy, 503 on degraded/unhealthy.
 */
import { NextResponse } from "next/server";

import { env } from "~/env";

export const runtime = "nodejs";
// Disable caching — health checks must always reflect current state
export const dynamic = "force-dynamic";

interface ServiceStatus {
  status: "ok" | "degraded" | "unavailable";
  latencyMs?: number;
  message?: string;
}

interface HealthResponse {
  status: "ok" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  services: {
    convex: ServiceStatus;
    auth: ServiceStatus;
  };
}

/**
 * Checks Convex connectivity by verifying CONVEX_URL is set and not a CI placeholder.
 *
 * WHY: A missing or placeholder CONVEX_URL causes all database/auth operations
 * to fail with cryptic errors like "InvalidDeploymentName". Detecting this early
 * here surfaces the misconfiguration clearly at the HTTP layer.
 *
 * Placeholder detection is skipped in CI (process.env.CI is set by Woodpecker/GitHub
 * Actions) because CI intentionally uses placeholder values for build/test isolation.
 */
function checkConvexConnectivity(): ServiceStatus {
  const convexUrl = env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return {
      status: "unavailable",
      message: "CONVEX_URL not configured",
    };
  }
  // In non-CI environments, detect CI placeholder values that would break auth.
  // Placeholder URLs pass z.string().url() validation but fail at runtime with
  // "InvalidDeploymentName" — catch it here before requests fail silently.
  // eslint-disable-next-line no-restricted-properties
  if (!process.env.CI && convexUrl.includes("placeholder")) {
    return {
      status: "unavailable",
      message:
        "CONVEX_URL is a CI placeholder — set real value in .env.local (run: npx convex dev)",
    };
  }
  return { status: "ok" };
}

/**
 * Checks auth service configuration.
 * Verifies AUTH_SECRET is present which is required for session handling.
 */
function checkAuthService(): ServiceStatus {
  // AUTH_SECRET is a server-side env var validated via authEnv() in packages/auth/env.ts.
  // We use process.env directly here because AUTH_SECRET is not exposed through the
  // client-side env schema — accessing it via authEnv() would require the full auth
  // package import which is unnecessary for a lightweight health check.
  // eslint-disable-next-line no-restricted-properties
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return {
      status: "degraded",
      message: "AUTH_SECRET not configured",
    };
  }
  return { status: "ok" };
}

export function GET() {
  const convex = checkConvexConnectivity();
  const auth = checkAuthService();

  // Determine overall health status
  const hasUnavailable = convex.status === "unavailable";
  const hasDegraded =
    convex.status === "degraded" || auth.status === "degraded";

  let overallStatus: HealthResponse["status"] = "ok";
  if (hasUnavailable) {
    overallStatus = "unhealthy";
  } else if (hasDegraded) {
    overallStatus = "degraded";
  }

  const body: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
    services: {
      convex,
      auth,
    },
  };

  // Return 503 when unhealthy so load balancers remove the instance
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(body, { status: httpStatus });
}
