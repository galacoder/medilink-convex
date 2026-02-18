/**
 * @medilink/auth/client - Auth client for React/browser usage
 *
 * Creates the Better Auth client with organization plugin support.
 * Used in client components and the ConvexBetterAuthProvider.
 *
 * WHY: The auth client must be configured with the organization plugin
 * to expose useOrganization() and organization management methods.
 * This is the single source of truth for client-side auth configuration.
 */
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * The Better Auth client instance with organization support.
 *
 * Exports React hooks:
 * - useSession() — current user session
 * - useOrganization() — current active organization
 * - signIn.email() — email/password sign in
 * - signUp.email() — email/password sign up
 * - organization.create() — create a new organization
 * - organization.setActive() — set the active organization
 */
export const authClient = createAuthClient({
  // Organization plugin enables multi-tenancy with owner/admin/member roles
  plugins: [organizationClient()],
});

// Re-export hooks for convenient imports
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  useActiveOrganization,
  useListOrganizations,
  organization,
} = authClient;

// Re-export types from better-auth client
export type { Session } from "better-auth";
