/**
 * Auth client for the web app.
 *
 * Re-exports from @medilink/auth/client to ensure a single source of truth
 * for auth client configuration across the monorepo.
 *
 * WHY: Centralizing auth client config in @medilink/auth/client means
 * any future changes (adding plugins, changing providers) only happen
 * in one place.
 */
export {
  authClient,
  organization,
  signIn,
  signOut,
  signUp,
  useActiveOrganization,
  useListOrganizations,
  useSession,
} from "@medilink/auth/client";

export type { Session } from "@medilink/auth/client";
