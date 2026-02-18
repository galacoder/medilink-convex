/**
 * Better Auth API route handler.
 *
 * WHY: This route handles all Better Auth endpoints:
 * - POST /api/auth/sign-up/email — email/password registration
 * - POST /api/auth/sign-in/email — email/password login
 * - GET  /api/auth/get-session  — current session
 * - POST /api/auth/sign-out     — logout
 * - GET/POST /api/auth/organization/* — org management
 *
 * The handler is provided by convexBetterAuthNextJs which routes requests
 * to the Convex Better Auth component (convex/auth.ts) via HTTP actions.
 */
import { handler } from "~/lib/convex";

export const GET = handler.GET;
export const POST = handler.POST;
