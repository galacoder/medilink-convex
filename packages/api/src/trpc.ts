/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod/v4";

// TODO (M0-2): Import Convex client here when Convex is set up

/**
 * Minimal auth API interface for the tRPC context.
 *
 * WHY: The Convex component model requires Better Auth to be instantiated
 * per-request with the Convex context. For tRPC, we use a minimal interface
 * that abstracts session retrieval, allowing both the old standalone pattern
 * and the new Convex-native pattern.
 *
 * TODO (M1-2): Replace with Convex-native session retrieval (getToken + fetchAuthQuery)
 */
/**
 * Organization-aware session type.
 * Better Auth's organization plugin populates activeOrganizationId and role
 * when a user has an active organization set.
 *
 * WHY: AC-7 requires the session to include organizationId, role, and platformRole
 * so that tRPC procedures can enforce organization-scoped authorization.
 */
export interface SessionData {
  user?: {
    id: string;
    name: string;
    email: string;
    /** Platform-level role (platform_admin, platform_support, or undefined for regular users) */
    platformRole?: "platform_admin" | "platform_support" | null;
  } | null;
  session?: {
    id: string;
    userId: string;
    /** Active organization ID (set by Better Auth organization plugin) */
    activeOrganizationId?: string | null;
  } | null;
}

export interface AuthApi {
  getSession: (opts: { headers: Headers }) => Promise<SessionData | null>;
}

export interface AuthContext {
  api: AuthApi;
}

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: AuthContext;
}) => {
  const authApi = opts.auth.api;
  const session = await authApi.getSession({
    headers: opts.headers,
  });

  // Extract organization-aware session fields (AC-7)
  // WHY: Organization context must be available in every authenticated request
  // so that tRPC procedures can enforce organization-scoped authorization
  // without making additional database queries.
  const organizationId = session?.session?.activeOrganizationId ?? null;
  const platformRole = session?.user?.platformRole ?? null;

  return {
    authApi,
    session,
    /** Active organization ID for the current request */
    organizationId,
    /** Platform-level role (null for regular users) */
    platformRole,
    // TODO (M0-2): Add Convex client to context
  };
};
/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });
