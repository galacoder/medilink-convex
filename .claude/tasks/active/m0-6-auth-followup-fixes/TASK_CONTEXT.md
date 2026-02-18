# TASK_CONTEXT.md -- M0-6 Auth Follow-Up Fixes

## Quick Reference

| Field | Value |
|-------|-------|
| Task ID | m0-6-auth-followup-fixes |
| Branch | fix/m0-6-auth-followup-fixes |
| Worktree | /home/sangle/dev/worktrees/m0-6-auth-followup-fixes |
| Project Root | /home/sangle/dev/medilink-convex |
| Base Branch | main |
| Domain | coding (auth/middleware) |
| Total Waves | 5 |
| Total Features | 15 |
| Estimated Time | ~100 minutes |

## Critical Files Map

| File | Wave(s) | Change Type |
|------|---------|-------------|
| `apps/web/src/app/(auth)/sign-up/page.tsx` | 1 | Edit (add setActive) |
| `apps/web/src/middleware.ts` | 2 | Edit (extend session parsing, add portal validation) |
| `apps/web/src/lib/portal-routing.ts` | 2 | Edit (add validation helper) |
| `apps/web/src/app/(auth)/sign-in/page.tsx` | 3 | Edit (useSearchParams + Suspense) |
| `apps/web/src/components/layout/header.tsx` | 3 | Edit (remove navItems prop) |
| `apps/web/src/components/layout/portal-layout.tsx` | 3, 4 | Edit (remove navItems from Header call, then refactor to server component) |
| `apps/web/src/components/layout/mobile-nav-controller.tsx` | 4 | Create (new client component) |
| `apps/web/src/components/layout/index.ts` | 4 | Edit (add export) |
| `packages/auth/src/middleware.ts` | 5 | Edit (remove dead exports) |

## Wave Execution Order

Waves MUST execute sequentially because:
1. Wave 1 (sign-up fix) is independent but highest priority
2. Wave 2 (cross-portal) depends on understanding session API shape
3. Wave 3 modifies portal-layout.tsx (Header call) -- must complete before Wave 4
4. Wave 4 restructures portal-layout.tsx -- needs Wave 3 changes in place
5. Wave 5 is verification -- must run after all code changes

## Auth Architecture Quick Reference

- Auth client: `packages/auth/src/client.ts` exports `organization`, `signUp`, `signIn`, `signOut`
- Session API: `/api/auth/get-session` returns `{ user, session }` with org plugin enrichment
- Middleware runtime: Edge (no Node.js APIs, no Convex direct access)
- Session cookie: `better-auth.session_token` or `__Secure-better-auth.session_token`
- JWT payload: `{ organizationId, platformRole }` (set in `convex/auth.ts:60-71`)

## Import Conventions

```typescript
// Path alias (NOT @/ -- uses ~/)
import { organization, signUp } from "~/auth/client";
import { getPortalFromPathname } from "~/lib/portal-routing";
import { Header } from "~/components/layout/header";

// Package imports
import { isPublicPath } from "@medilink/auth/middleware";
import { Button } from "@medilink/ui/button";
```
