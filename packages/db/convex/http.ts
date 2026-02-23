/**
 * Convex HTTP router — mounts Better Auth route handlers and admin endpoints.
 *
 * WHY: Better Auth requires HTTP actions registered on the Convex deployment
 * to handle authentication endpoints (/api/auth/*). Without this file the
 * deployment has no HTTP actions and returns "HTTP actions not enabled" for
 * every auth request.
 *
 * CORS is enabled because the Next.js App Router proxies auth requests from
 * the browser to the Convex site URL, which is a cross-origin request.
 *
 * Admin endpoint:
 *   POST /api/admin/set-platform-role — E2E test setup only (requires secret)
 *   WHY: Allows E2E global-setup to grant platform_admin role to test users
 *   without needing a JWT. Protected by ADMIN_SETUP_SECRET env var.
 *
 * vi: "Đăng ký các route xác thực HTTP" / en: "Register auth HTTP routes"
 */
import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";
import { setPlatformRoleHttp } from "./userActions";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

/**
 * E2E admin setup endpoint.
 *
 * WHY: E2E global-setup needs to grant platform_admin role to a test user
 * after signup. This endpoint is protected by ADMIN_SETUP_SECRET and is
 * only effective in environments where that secret is configured.
 *
 * Security: Returns 403 if ADMIN_SETUP_SECRET is not set (safe in production).
 *
 * vi: "Endpoint thiết lập quản trị viên E2E"
 * en: "E2E admin setup endpoint"
 */
http.route({
  path: "/api/admin/set-platform-role",
  method: "POST",
  handler: setPlatformRoleHttp,
});

export default http;
