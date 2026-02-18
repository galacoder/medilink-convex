# DISCOVERY: M0-3 Configure Better Auth with Organization Plugin

## Key Findings

### 1. Better Auth + Convex Architecture is Component-Based (CRITICAL)

The `@convex-dev/better-auth` package uses a **Convex component model** -- NOT the traditional `better-auth/adapters/convex` approach that the current code's TODO comments reference. This means:

- Auth lives in `convex/auth.ts` (Convex function context), NOT in `packages/auth/src/index.ts` as a standalone server
- Requires `convex/convex.config.ts` with `app.use(betterAuth)` component registration
- Requires `convex/auth.config.ts` with `getAuthConfigProvider()`
- Database adapter is `authComponent.adapter(ctx)` from the component client
- Client uses `ConvexBetterAuthProvider` instead of plain `ConvexProvider`

**Impact**: The existing `packages/auth/src/index.ts` `initAuth()` function will need significant restructuring. The current pattern of instantiating Better Auth in `apps/web/src/auth/server.ts` must change to the Convex component pattern.

### 2. Current Auth State (Partially Scaffolded)

| File | Status | Notes |
|------|--------|-------|
| `packages/auth/src/index.ts` | Exists | Has `initAuth()` with Google OAuth, oAuthProxy, expo plugins. TODO: Convex adapter |
| `packages/auth/env.ts` | Exists | Validates AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET |
| `apps/web/src/auth/server.ts` | Exists | Instantiates auth with nextCookies plugin |
| `apps/web/src/auth/client.ts` | Exists | Basic `createAuthClient()` |
| `apps/web/src/app/api/auth/[...all]/route.ts` | Exists | GET/POST handlers |
| `packages/auth/package.json` | Exists | Exports `./client` and `./middleware` (files missing) |
| `convex/convex.config.ts` | Missing | Needed for component registration |
| `convex/auth.config.ts` | Missing | Needed for auth provider config |
| `convex/auth.ts` | Missing | Needed for Better Auth Convex-side setup |
| `apps/web/src/middleware.ts` | Missing | Needed for route group protection |

### 3. Schema Compatibility Analysis

Existing `convex/schema.ts` tables (from M0-2):
- `organizations` - has name, slug, org_type, timestamps
- `organizationMemberships` - has orgId, userId, role, timestamps
- `users` - has name, email, platformRole, timestamps

Better Auth organization plugin creates its own tables (`organization`, `member`, `invitation`). With the Convex component model, Better Auth manages its OWN tables inside the component -- our custom schema tables are separate. We need a bridging strategy:
- Better Auth manages: user, session, account, verification tables (inside component)
- Our schema manages: organizations, organizationMemberships, users (application-level)
- The `convex` plugin from `@convex-dev/better-auth/plugins` syncs auth users to our Convex users table

### 4. Organization Plugin Configuration

The Better Auth organization plugin provides:
- Default roles: owner, admin, member (matches our schema)
- Organization CRUD with metadata support (can store org_type)
- Invitation system with email
- Role-based access control

Custom metadata for `org_type` (hospital/provider) can be stored via organization metadata or a custom field.

### 5. Dependencies and Package Requirements

New packages needed:
- `@convex-dev/better-auth` -- Convex component for Better Auth (root + packages/auth)
- Organization plugin is built into `better-auth/plugins` (already available)

Current versions:
- `better-auth`: 1.4.0-beta.9 (catalog)
- `convex`: ^1.31.7 (root devDependency)

### 6. Testing Constraints

- No test framework (Vitest/Jest) configured
- Existing tests use tsx + custom assertions (pure Node)
- Cannot test Convex functions without running backend
- Can only test: validators, pure utility functions, type assertions
- Test approach: Zod validators for auth inputs + type-level tests

### 7. tRPC Integration Point

`packages/api/src/trpc.ts` receives `Auth` type and creates session context. After M0-3:
- Session should include organizationId, role, platformRole
- `protectedProcedure` should verify session AND organization membership
- New `orgAdminProcedure` may be needed for org-level operations

## Dependencies Identified

| Dependency | Type | Risk |
|------------|------|------|
| `@convex-dev/better-auth` package compatibility | External | HIGH -- beta ecosystem, verify API stability |
| Convex component model vs standalone Better Auth | Architecture | HIGH -- restructures auth pattern |
| Better Auth org plugin + Convex adapter interop | Integration | MEDIUM -- relatively new combination |
| Existing auth code refactoring | Internal | LOW -- code is scaffolded with TODOs |
| ConvexClientProvider must change to ConvexBetterAuthProvider | Internal | LOW -- straightforward swap |

## Risks

1. **Better Auth 1.4.0-beta.9 + Convex component**: Both are relatively new. API may differ from docs.
2. **Organization plugin within Convex component**: May need custom configuration for org_type metadata.
3. **Session enrichment**: Getting organizationId, role, platformRole into session requires careful plugin configuration.
4. **Middleware pattern**: Next.js 16 middleware with Better Auth Convex may have specific patterns.

## Recommended Tools

| Tool | Type | Relevance | Purpose |
|------|------|-----------|---------|
| authenticating-with-better-auth | skill | 95% | Better Auth configuration patterns |
| developing-with-convex | skill | 90% | Convex component model, schema patterns |
| developing-with-nextjs | skill | 75% | Middleware, route groups, Server Components |
| building-with-turborepo | skill | 60% | Monorepo package configuration |
| test-driven-development | skill | 55% | TDD for validators and pure functions |

## GitHub Issue Requirements

Linked to: [#48](https://github.com/galacoder/medilink-convex/issues/48) - M0-3: Configure Better Auth with Organization Plugin

### Acceptance Criteria
| ID | Criterion | Status |
|----|-----------|--------|
| AC-1 | Better Auth installed with Convex adapter (@medilink/auth package) | pending |
| AC-2 | Organization plugin enabled with org_type metadata field | pending |
| AC-3 | Hospital org sign-up flow works (creates org with org_type=hospital) | pending |
| AC-4 | Provider org sign-up flow works (creates org with org_type=provider) | pending |
| AC-5 | Platform admin sign-in works (user with platformRole=platform_admin) | pending |
| AC-6 | Organization membership roles enforced: owner, admin, member | pending |
| AC-7 | Session includes organizationId, role, and platformRole | pending |
| AC-8 | Auth API routes at /api/auth/[...all] | pending |
| AC-9 | Email/password provider configured | pending |
| AC-10 | CSRF protection enabled | pending |
| AC-11 | TypeScript types pass pnpm typecheck with zero errors | pending |
| AC-12 | Auth flows tested: sign-up -> email verification -> sign-in -> session check | pending |

### Technical Spec Files
| Path | Action | Purpose |
|------|--------|---------|
| packages/auth/src/index.ts | modify | Better Auth server config with Convex adapter + org plugin |
| packages/auth/src/client.ts | create | Auth client with useSession, useOrganization hooks |
| packages/auth/package.json | modify | @medilink/auth package definition |
| apps/web/src/middleware.ts | create | Route group protection |
| apps/web/src/app/api/auth/[...all]/route.ts | modify | Better Auth API handler |
| packages/validators/src/auth.ts | create | Zod validators for sign-up/sign-in inputs |
