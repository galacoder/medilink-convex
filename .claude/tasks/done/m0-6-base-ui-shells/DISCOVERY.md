# DISCOVERY: M0-6 Base UI Shells

## Task Overview

Create the base UI shell infrastructure for MediLink's three portals (Hospital, Provider, Platform Admin) plus auth pages. This is a foundational scaffold task that all M2/M3/M4 feature work depends on.

**Issue**: #51 | **Effort**: 8 SP / L | **Milestone**: M0
**Depends on**: M0-3 Better Auth (DONE)
**Blocks**: 14 downstream issues (M2-1 through M2-5, M3-1 through M3-4, M4-1 through M4-5)

---

## Key Findings

### 1. Current UI Component Inventory (8 of 15+ needed)

Existing shadcn/ui components in `packages/ui/src/`:
- button.tsx, dropdown-menu.tsx, field.tsx, input.tsx, label.tsx, separator.tsx, theme.tsx, toast.tsx

Missing components required for portal shells:
- **Card** - Dashboard cards, auth form containers
- **Sheet** - Mobile navigation drawer
- **Avatar** - User menu, header
- **Badge** - Status indicators, nav item counts
- **ScrollArea** - Sidebar overflow
- **Skeleton** - Loading states
- **Tooltip** - Collapsed sidebar labels
- **Tabs** - Dashboard sections (future)
- **Select** - Form controls
- **Checkbox** - Form controls
- **AlertDialog** - Confirmations
- **RadioGroup** - Org type selector on sign-up
- **Sidebar** - shadcn sidebar primitive (if using their sidebar component)

shadcn config: `new-york` style, RSC-first, CSS variables with OKLCh colors, zinc base.

### 2. No Route Groups Exist Yet

Current app structure is flat T3 Turbo template:
```
apps/web/src/app/
  layout.tsx          (root layout with provider chain)
  page.tsx            (T3 template homepage)
  _components/        (auth-showcase, posts)
  api/auth/[...all]/  (Better Auth API route)
  api/health/         (health check)
  api/trpc/[trpc]/    (tRPC handler)
```

Need to create 4 route groups: `(auth)/`, `(hospital)/`, `(provider)/`, `(platform-admin)/`

### 3. Auth Infrastructure Ready

Better Auth client fully configured with organization plugin:
- `useSession()` -- current user session
- `useActiveOrganization()` -- active org context
- `signIn.email()` / `signUp.email()` -- auth flows
- `organization.create()` / `organization.setActive()` -- org management

Server-side auth available via `~/auth/server.ts`:
- `getSession()` -- cached token retrieval
- `isUserAuthenticated()` -- auth check

### 4. Session Structure Supports Portal Routing

```typescript
user.platformRole: "platform_admin" | "platform_support" | null
session.activeOrganizationId: string | null
organizations.org_type: "hospital" | "provider"
```

Routing decision tree:
1. No session -> `/sign-in`
2. platformRole is platform_admin/platform_support -> `/admin/dashboard`
3. activeOrganizationId exists, org_type="hospital" -> `/hospital/dashboard`
4. activeOrganizationId exists, org_type="provider" -> `/provider/dashboard`
5. No activeOrganizationId -> org selection flow

### 5. Middleware Exists but Needs Portal Logic

Current middleware (`apps/web/src/middleware.ts`):
- Checks for `better-auth.session_token` cookie
- Redirects unauthenticated users to `/sign-in?returnTo=<path>`
- No role-based or portal-based routing

Auth middleware constants (`packages/auth/src/middleware.ts`):
- `PUBLIC_PATHS`: /, /sign-in, /sign-up, /forgot-password, /reset-password, /api/auth
- `PROTECTED_ROUTES`: admin=/admin, staff=/staff, student=/student (STALE -- needs update to hospital/provider/admin)

### 6. Architecture Constraints

- Path alias: `~/` (NOT `@/`) per `apps/web/tsconfig.json`
- Named exports only (no default exports)
- Server Components by default, `"use client"` only when needed
- Bilingual: Vietnamese primary, English secondary -- all labels as `{ vi: "...", en: "..." }`
- Root layout chain: `ThemeProvider > ConvexClientProvider > TRPCReactProvider`
- ThemeToggle already exists in root layout (bottom-right corner) -- should move into Header

### 7. Middleware Edge Runtime Limitation

Next.js middleware runs in Edge Runtime -- cannot directly call Convex queries. For portal routing based on org_type, the middleware must either:
- (a) Read org_type from a cookie set during auth/org-selection
- (b) Use the Better Auth session API to fetch user context
- (c) Rely on client-side routing after initial page load

Option (a) is recommended for performance -- set an `orgType` cookie when organization is activated.

---

## Dependencies Identified

| Dependency | Status | Impact |
|-----------|--------|--------|
| M0-3 Better Auth (#48) | DONE | Auth client hooks available |
| radix-ui package | Installed (^1.4.3) | All shadcn components use radix primitives |
| @radix-ui/react-icons | Installed (^1.3.2) | Icons for nav items |
| convex | Installed (^1.31.7) | Real-time queries for dashboard data (future) |
| better-auth | Installed (1.4.9) | Session management, org plugin |

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Middleware cannot query Convex in Edge Runtime | High | Use cookie-based org_type; set cookie on org activation |
| 15+ shadcn components may have peer dependency conflicts | Low | Install sequentially, check each import |
| Bilingual labels add complexity to every component | Medium | Centralize in `lib/i18n/` modules; use consistent { vi, en } pattern |
| PROTECTED_ROUTES constants are stale (staff/student) | Medium | Update in Wave 5 to hospital/provider/admin |
| Root layout ThemeToggle position conflicts with Header toggle | Low | Remove from root layout, add to Header component |

---

## Recommended Tools

| Tool | Type | Relevance | Purpose |
|------|------|-----------|---------|
| building-with-shadcn-ui | skill | 95% | Component installation, variant patterns |
| developing-with-nextjs | skill | 90% | Route groups, middleware, Server Components |
| authenticating-with-better-auth | skill | 88% | Sign-in/up forms, session hooks |
| building-ui-templates | skill | 78% | Pre-built dashboard sidebar and auth form templates |
| developing-with-convex | skill | 60% | Future dashboard queries (not needed in shells) |
| sequential-thinking | mcp | -- | Middleware routing logic analysis |
