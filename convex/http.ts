/**
 * Convex HTTP router — mounts Better Auth route handlers.
 *
 * WHY: Better Auth requires HTTP actions registered on the Convex deployment
 * to handle authentication endpoints (/api/auth/*). Without this file the
 * deployment has no HTTP actions and returns "HTTP actions not enabled" for
 * every auth request.
 *
 * CORS is enabled because the Next.js App Router proxies auth requests from
 * the browser to the Convex site URL, which is a cross-origin request.
 *
 * vi: "Đăng ký các route xác thực HTTP" / en: "Register auth HTTP routes"
 */
import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

export default http;
