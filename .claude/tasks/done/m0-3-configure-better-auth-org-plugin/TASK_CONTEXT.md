# TASK_CONTEXT: M0-3 Configure Better Auth with Organization Plugin

## Quick Reference

| Field | Value |
|-------|-------|
| **Slug** | m0-3-configure-better-auth-org-plugin |
| **Domain** | coding |
| **Branch** | feat/m0-3/configure-better-auth-org-plugin |
| **Worktree** | /home/sangle/dev/worktrees/m0-3-configure-better-auth-org-plugin |
| **Issue** | [#48](https://github.com/galacoder/medilink-convex/issues/48) |
| **Milestone** | M0: Infrastructure Setup |
| **Priority** | critical |
| **Depends On** | M0-1 (#46), M0-2 (#47) |
| **Blocks** | M0-6 (#51), M1-2 (#53), M1-3 (#54) |
| **Estimated** | ~120 minutes (4 waves) |

## Task Description

Set up Better Auth with Convex adapter and organization plugin. Configure the 3-actor auth model: hospital orgs, provider orgs, and platform admin users. Each organization has owner/admin/member roles. Email/password provider, CSRF protection, middleware for route groups, auth API handler.

## Critical Architecture Decision

The `@convex-dev/better-auth` package uses a **Convex component model** where:
- Better Auth runs INSIDE Convex functions (not as a standalone server)
- Requires `convex/convex.config.ts` with `app.use(betterAuth)`
- Auth config lives in `convex/auth.ts` with `createAuth(ctx)`
- Client uses `ConvexBetterAuthProvider` (not plain `ConvexProvider`)
- SSR uses `convexBetterAuthNextJs()` helpers

This is different from the current scaffolded approach in `packages/auth/src/index.ts`.

## Wave Summary

| Wave | Name | Complexity | Model | Est. |
|------|------|-----------|-------|------|
| 1 | Convex Auth Infrastructure + Validators | high | opus | 40m |
| 2 | Auth Package Restructure + Client Integration | high | opus | 35m |
| 3 | Middleware + Route Protection + Session Enrichment | medium | sonnet | 25m |
| 4 | Typecheck + Integration Verification | medium | sonnet | 20m |

## Key Files to Modify/Create

### New Files
- `convex/convex.config.ts` - Convex component registration
- `convex/auth.config.ts` - Auth provider config
- `convex/auth.ts` - Better Auth Convex-side setup
- `packages/auth/src/client.ts` - Auth client with org hooks
- `packages/auth/src/middleware.ts` - Middleware helpers
- `packages/validators/src/auth.ts` - Auth Zod validators
- `packages/validators/src/auth.test.ts` - Validator tests
- `apps/web/src/middleware.ts` - Route group protection
- `apps/web/src/lib/convex.ts` - SSR auth helpers

### Modified Files
- `packages/auth/src/index.ts` - Restructure for Convex component model
- `packages/auth/package.json` - Add @convex-dev/better-auth dependency
- `apps/web/src/app/convex-client-provider.tsx` - Swap to ConvexBetterAuthProvider
- `apps/web/src/auth/server.ts` - Update for Convex auth pattern
- `apps/web/src/auth/client.ts` - Re-export from @medilink/auth/client
- `packages/api/src/trpc.ts` - Org-aware session context
- `apps/web/src/app/api/auth/[...all]/route.ts` - Updated handler

## Acceptance Criteria Mapping

| AC | Description | Wave |
|----|-------------|------|
| AC-1 | Better Auth with Convex adapter installed | Wave 1 |
| AC-2 | Organization plugin with org_type | Wave 1 |
| AC-3 | Hospital org sign-up | Wave 1+2 |
| AC-4 | Provider org sign-up | Wave 1+2 |
| AC-5 | Platform admin sign-in | Wave 2+3 |
| AC-6 | Org membership roles | Wave 1 |
| AC-7 | Session includes orgId, role, platformRole | Wave 3 |
| AC-8 | Auth API routes | Wave 3 |
| AC-9 | Email/password provider | Wave 1 |
| AC-10 | CSRF protection | Wave 1 |
| AC-11 | Typecheck passes | Wave 4 |
| AC-12 | Auth flow tests | Wave 1+4 |

## Testing Strategy

- **No test framework**: Use tsx + custom assertions (matching existing pattern)
- **Pure-Node only**: No Convex backend required for tests
- **Focus**: Zod validators for auth inputs (bilingual messages)
- **Regression**: Run existing organizations.test.ts
- **Integration**: pnpm typecheck + pnpm lint as verification gates
