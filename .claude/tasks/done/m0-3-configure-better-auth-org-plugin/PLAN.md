# PLAN: M0-3 Configure Better Auth with Organization Plugin

## Summary

Configure Better Auth with Convex component adapter and organization plugin for MediLink's 3-actor auth model (hospital orgs, provider orgs, platform admins). This involves restructuring the existing scaffolded auth code from a standalone Better Auth pattern to the Convex component model, enabling email/password auth, organization plugin with org_type metadata, CSRF protection, route group middleware, and Zod validators for auth inputs.

## Architecture Decision

**Key Insight**: The `@convex-dev/better-auth` package uses a **Convex component model** where Better Auth runs inside Convex functions, NOT as a standalone server-side instance. This fundamentally changes the auth architecture:

- **Before (current scaffold)**: `packages/auth/src/index.ts` -> `initAuth()` -> standalone Better Auth
- **After (Convex component)**: `convex/auth.ts` -> `createAuth(ctx)` -> Convex-integrated Better Auth
- **Client**: `ConvexBetterAuthProvider` replaces plain `ConvexProvider`
- **Server helpers**: `convexBetterAuthNextJs()` for SSR token handling

The `packages/auth/` package will serve as the **shared configuration layer** that both the Convex backend and the Next.js frontend import from, keeping the monorepo architecture clean.

## Wave Structure

### Wave 1: Convex Auth Infrastructure + Validators (Foundation)
Install `@convex-dev/better-auth`, create Convex component config, auth config, and auth setup. Create Zod validators for auth inputs. This wave establishes the foundation that all subsequent waves depend on.

### Wave 2: Auth Package Restructure + Client Integration
Restructure `packages/auth/` for Convex component model. Update `ConvexClientProvider` to use `ConvexBetterAuthProvider`. Create auth client with organization hooks. Update server-side auth helpers.

### Wave 3: Middleware + Route Protection + Session Enrichment
Create Next.js middleware for route group protection. Configure session to include organizationId, role, platformRole. Update tRPC context for organization-aware procedures.

### Wave 4: Typecheck + Integration Verification
Run full `pnpm typecheck` across all workspaces. Fix any type errors. Verify auth API route handler works. Run existing validator tests to ensure no regressions.

## Estimated Total: ~120 minutes (4 waves)
