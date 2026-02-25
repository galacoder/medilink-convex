/**
 * Convex app configuration with installed components.
 *
 * WHY: Convex components (like @convex-dev/rate-limiter) must be registered
 * here so the Convex runtime installs their backing tables and functions.
 *
 * vi: "Cấu hình ứng dụng Convex" / en: "Convex app configuration"
 */
import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();
app.use(rateLimiter);

export default app;
