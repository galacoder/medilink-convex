/**
 * Convex app configuration with installed components.
 *
 * WHY: betterAuth manages auth tables and session handling.
 * rateLimiter provides rate limiting for API endpoints.
 *
 * vi: "Cấu hình ứng dụng Convex" / en: "Convex app configuration"
 */
import betterAuth from "@convex-dev/better-auth/convex.config";
import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(rateLimiter);

export default app;
