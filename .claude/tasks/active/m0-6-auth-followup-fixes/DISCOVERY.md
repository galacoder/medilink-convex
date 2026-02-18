# DISCOVERY.md -- M0-6 Post-Merge Follow-Up

## Task Context

**Task**: fix(auth/middleware): M0-6 post-merge follow-up -- critical sign-up redirect loop + cross-portal enforcement + HIGH fixes
**Task ID**: m0-6-auth-followup-fixes
**Domain**: coding (auth/middleware)
**Created**: 2026-02-18

---

## Key Findings

### CRITICAL 1: Sign-Up Redirect Loop (Infinite)

**Root Cause**: `apps/web/src/app/(auth)/sign-up/page.tsx` line 74-84 calls `organization.create()` but NEVER calls `organization.setActive()`. The Better Auth session retains `activeOrganizationId: null`. When the router pushes to `/hospital/dashboard`, middleware Branch 3 (line 147) checks `!sessionData.activeOrganizationId` and redirects back to `/sign-up`, creating an infinite loop.

**Evidence**:
- `organization.setActive` IS available -- confirmed in `packages/auth/src/client.ts:38` (exported from `authClient`)
- Middleware Branch 3 at `middleware.ts:147-152` explicitly redirects to `/sign-up` when `activeOrganizationId` is null
- The `callbackURL` in `signUp.email()` is irrelevant because the middleware intercepts before the callback resolves

**Impact**: ALL new user registrations are broken. Users cannot complete sign-up.

### CRITICAL 2: Cross-Portal Access Not Enforced

**Root Cause**: Middleware Branch 4 (`middleware.ts:154-163`) unconditionally calls `NextResponse.next()` for any authenticated user with an active organization. There is no check that the user's org_type matches the portal they are accessing.

**Evidence**:
- `portal-routing.ts:79` defines `orgType?: string | null` on `MiddlewareSessionData` but it is never populated
- `middleware.ts:66-75` parses only `user.platformRole` and `session.activeOrganizationId` from the session API response -- ignores `session.activeOrganization.metadata`
- Better Auth session API (`/api/auth/get-session`) with org plugin DOES return `session.activeOrganization.metadata.org_type` but middleware never reads it
- Root path `/` redirect sends to `/sign-in` instead of the user's correct dashboard

**Impact**: Hospital users can access provider routes and vice versa. Security boundary violation.

### HIGH 1: Sign-In Hardcoded callbackURL

**Root Cause**: `sign-in/page.tsx:45` hardcodes `callbackURL: "/hospital/dashboard"` and line 55 does `router.push("/hospital/dashboard")`. The `returnTo` query parameter set by middleware (line 110) is completely ignored.

**Impact**: Provider users always land on hospital dashboard after sign-in. Deep-link return is broken.

### HIGH 2: Header Unused navItems Prop

**Root Cause**: `header.tsx:22-25` declares `navItems: NavItem[]` in `HeaderProps` interface, but the function destructuring on line 35 only uses `{ orgName, onMobileMenuOpen }`. The `navItems` prop is passed from `portal-layout.tsx:42` but never rendered.

**Impact**: Dead code. Minor -- causes confusion during code review.

### HIGH 3: PortalLayout Forces Client Bundle

**Root Cause**: `portal-layout.tsx:1` has `"use client"` solely because of `useState(false)` on line 32 for mobile nav open state. This forces ALL child components rendered by portal layouts (every hospital, provider, and admin page) into the client bundle.

**Impact**: Increased JavaScript payload, prevents server-side rendering of portal page content. All three portal layout files (`hospital/layout.tsx`, `provider/layout.tsx`, `admin/layout.tsx`) are affected because they all use `<PortalLayout>`.

### MEDIUM: Dead Exports

- `packages/auth/src/middleware.ts:36-40` exports `PROTECTED_ROUTES` but grep confirms nothing imports it
- `requiresAuth()` function wraps `!isPublicPath()` -- may also be unused

---

## Dependencies Identified

1. **Wave 1 is independent** -- single file fix in sign-up page
2. **Wave 2 depends on understanding Better Auth session response** -- need to parse `activeOrganization.metadata` correctly
3. **Wave 3 feature 3.3 (Header navItems removal) depends on Wave 4** -- need to coordinate because portal-layout.tsx is modified in both waves
   - Resolution: Wave 3 removes navItems from `<Header>` call in portal-layout.tsx; Wave 4 restructures portal-layout.tsx entirely. Safe because Wave 4 starts fresh with the file.
4. **Wave 5 is a verification wave** -- must run AFTER all other waves complete

---

## Risks Assessed

| Risk | Severity | Mitigation |
|------|----------|------------|
| Better Auth session API response shape differs from expected | Medium | Read Better Auth org plugin docs; the `activeOrganization` field with metadata is documented |
| PortalLayout refactor breaks visual layout | Medium | Visual comparison before/after; the JSX structure is identical, only the component boundary moves |
| useSearchParams without Suspense causes Next.js build error | Low | Wrap in Suspense boundary (documented pattern) |
| Edge runtime compatibility for middleware changes | Low | No new Node.js APIs introduced; same fetch-based pattern |

---

## Recommended Tools with Relevance Scores

| Tool | Type | Relevance | Purpose |
|------|------|-----------|---------|
| authenticating-with-better-auth | skill | 95% | Better Auth organization plugin API, session shape, setActive method |
| developing-with-nextjs | skill | 85% | Edge middleware patterns, Server/Client component boundary, useSearchParams + Suspense |
| Read | core | 100% | Read source files for verification |
| Edit | core | 100% | Apply fixes to source files |
| Bash | core | 90% | Run typecheck, build, grep verification |

---

## Architecture Notes

- **Path alias**: `~/` maps to `apps/web/src/` (NOT `@/`)
- **Auth client import**: `import { organization, signUp } from "~/auth/client"`
- **Middleware runtime**: Edge (no Node.js APIs allowed)
- **Session fetch**: Middleware uses internal fetch to `/api/auth/get-session` because Edge cannot query Convex directly
- **Portal structure**: 3 portal layouts all use `<PortalLayout>` -- changes propagate to all 3
- **Bilingual**: Vietnamese primary, English comments. MVP phase -- Vietnamese-only strings acceptable for now
