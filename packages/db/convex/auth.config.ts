import type { AuthConfig } from "convex/server";
import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";

/**
 * Convex auth configuration.
 * Registers Better Auth as the authentication provider for Convex's built-in auth system.
 * This enables JWT token validation and user identity resolution for authenticated queries.
 */
export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
