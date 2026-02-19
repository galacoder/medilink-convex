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
 * Checks Convex connectivity by verifying the CONVEX_URL is set.
 * In production, a more thorough check would make a lightweight ping request
 * to the Convex deployment. For now, we verify configuration is present.
 *
 * WHY: A missing CONVEX_URL means all database operations will fail.
 * This is the most critical dependency — without it the app cannot function.
 */
function checkConvexConnectivity(): ServiceStatus {
  const convexUrl = env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return {
      status: "unavailable",
      message: "CONVEX_URL not configured",
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
