# PLAN: M0-6 Base UI Shells

## Summary

Build the foundational UI shell infrastructure for MediLink's three portals (Hospital, Provider, Platform Admin) plus auth pages. This task installs 10+ shadcn/ui components, creates auth forms with org type selection, builds reusable layout components (Sidebar, Header, MobileNav), assembles three portal shells with bilingual navigation, and wires role-based middleware routing. All 14 downstream M2/M3/M4 issues depend on this scaffold.

**5 waves | 19 features | ~185 minutes estimated**

---

## Wave 1: UI Component Foundation

**Objective**: Install 10+ shadcn/ui components and wire all exports so downstream portal shells can consume them.

**WHY**: Portal layouts need Card, Sheet, Avatar, Badge, Skeleton, ScrollArea, Tooltip, and Tabs components that do not exist yet. Installing them first prevents import errors in all subsequent waves.

**Complexity**: Low -- mechanical shadcn CLI installs plus export wiring, no business logic.

**Model**: sonnet | **Estimate**: 25 min

### Tasks

1. **Install shadcn/ui components via CLI** -- Run `pnpm dlx shadcn@latest add` in `packages/ui/` for: card, sheet, avatar, badge, scroll-area, skeleton, tooltip, tabs, select, checkbox, alert-dialog, radio-group, sidebar
2. **Wire package.json exports** -- Add `"./card": "./src/card.tsx"` etc. to `packages/ui/package.json` exports map
3. **Update index.ts barrel** -- Verify `packages/ui/src/index.ts` re-exports cn utility; no additional barrel exports needed (each component is a separate entry)

### Key Files
- `packages/ui/src/*.tsx` (13 new files)
- `packages/ui/package.json`
- `packages/ui/src/index.ts`

---

## Wave 2: Auth Pages

**Objective**: Create the (auth)/ route group with centered layout, sign-in page with email/password, and sign-up page with organization type selector.

**WHY**: Auth pages are the entry point for all users. Sign-up must capture org_type (hospital/provider) which drives all subsequent portal routing.

**Complexity**: Medium -- Better Auth client integration for forms, RadioGroup for org type selection, bilingual validation.

**Model**: sonnet | **Estimate**: 35 min

### Tasks

1. **Create (auth)/ layout** -- `apps/web/src/app/(auth)/layout.tsx`: centered card layout, no sidebar, optional logo/branding
2. **Build sign-in page** -- `apps/web/src/app/(auth)/sign-in/page.tsx`: email + password inputs, submit calls `signIn.email()`, link to sign-up, error handling, bilingual labels
3. **Build sign-up page** -- `apps/web/src/app/(auth)/sign-up/page.tsx`: email + password + name inputs, RadioGroup for org_type (hospital/provider), submit calls `signUp.email()` then `organization.create()`, bilingual labels
4. **Add bilingual auth labels** -- `apps/web/src/lib/i18n/auth-labels.ts`: all auth form strings in `{ vi, en }` format

### Key Files
- `apps/web/src/app/(auth)/layout.tsx`
- `apps/web/src/app/(auth)/sign-in/page.tsx`
- `apps/web/src/app/(auth)/sign-up/page.tsx`
- `apps/web/src/lib/i18n/auth-labels.ts`

### Dependencies
- Wave 1 (Card, Input, Button, RadioGroup components)

---

## Wave 3: Shared Layout Components

**Objective**: Build portal-agnostic Sidebar, Header, and MobileNav components that accept configurable nav items with bilingual labels.

**WHY**: All three portals share the same layout structure but with different nav items. Reusable components here prevent code duplication across portal shells.

**Complexity**: Medium -- responsive sidebar with collapse state, Sheet-based mobile nav, user dropdown with org context.

**Model**: sonnet | **Estimate**: 45 min

### Tasks

1. **Create configurable Sidebar** -- `apps/web/src/components/layout/sidebar.tsx`: accepts `NavItem[]`, renders icon + label, collapsible with Tooltip on collapsed state, uses ScrollArea for overflow, active state based on pathname
2. **Create Header** -- `apps/web/src/components/layout/header.tsx`: shows org name, user Avatar + DropdownMenu (sign-out, settings), mobile menu trigger button (hamburger icon for MobileNav), ThemeToggle integration
3. **Create MobileNav** -- `apps/web/src/components/layout/mobile-nav.tsx`: Sheet component triggered by Header hamburger, renders same NavItem[] as Sidebar, closes on link click
4. **Define nav config types** -- `apps/web/src/components/layout/nav-config.ts`: NavItem interface with icon, labelVi, labelEn, href, badge? fields; portal-specific nav arrays (hospitalNavItems, providerNavItems, adminNavItems)

### Key Files
- `apps/web/src/components/layout/sidebar.tsx`
- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/components/layout/mobile-nav.tsx`
- `apps/web/src/components/layout/nav-config.ts`
- `apps/web/src/components/layout/index.ts`

### Dependencies
- Wave 1 (Sheet, Avatar, ScrollArea, Tooltip, Badge, Skeleton components)

---

## Wave 4: Portal Shells

**Objective**: Create three route group layouts wiring shared components with portal-specific nav items and stub dashboard pages.

**WHY**: The three portal shells are the main deliverable. They provide the navigation structure that all M2/M3/M4 feature work will build inside.

**Complexity**: Medium -- three parallel implementations with portal-specific configs, repetitive but must be consistent.

**Model**: sonnet | **Estimate**: 40 min

### Tasks

1. **Hospital portal layout** -- `apps/web/src/app/(hospital)/layout.tsx`: composes Sidebar + Header + MobileNav with hospitalNavItems (Dashboard, Equipment/Thiet bi, Service Requests/Yeu cau dich vu, Consumables/Vat tu tieu hao, Disputes/Khieu nai)
2. **Hospital dashboard stub** -- `apps/web/src/app/(hospital)/dashboard/page.tsx`: heading + placeholder content
3. **Provider portal layout** -- `apps/web/src/app/(provider)/layout.tsx`: composes with providerNavItems (Dashboard, Service Offerings/Dich vu cung cap, Quotes/Bao gia, Services/Dich vu, Analytics/Phan tich)
4. **Provider dashboard stub** -- `apps/web/src/app/(provider)/dashboard/page.tsx`
5. **Platform admin layout** -- `apps/web/src/app/(platform-admin)/layout.tsx`: composes with adminNavItems (Dashboard, Hospitals/Benh vien, Providers/Nha cung cap, Service Requests/Yeu cau dich vu, Analytics/Phan tich, Audit Log/Nhat ky)
6. **Platform admin dashboard stub** -- `apps/web/src/app/(platform-admin)/dashboard/page.tsx`

### Key Files
- `apps/web/src/app/(hospital)/layout.tsx`
- `apps/web/src/app/(hospital)/dashboard/page.tsx`
- `apps/web/src/app/(provider)/layout.tsx`
- `apps/web/src/app/(provider)/dashboard/page.tsx`
- `apps/web/src/app/(platform-admin)/layout.tsx`
- `apps/web/src/app/(platform-admin)/dashboard/page.tsx`
- `apps/web/src/lib/i18n/portal-labels.ts`

### Dependencies
- Wave 3 (Sidebar, Header, MobileNav, nav-config)

---

## Wave 5: Middleware Portal Routing

**Objective**: Update middleware to route authenticated users to their correct portal based on platformRole and org_type. Unauthenticated users go to /sign-in.

**WHY**: Without portal routing, authenticated users land on the generic homepage instead of their role-specific dashboard. This is the security and UX boundary that gates all portal access.

**Complexity**: High -- auth state machine with 4 branches, Edge Runtime limitation (no Convex queries), cookie-based org_type detection.

**Model**: sonnet | **Estimate**: 40 min

### Tasks

1. **Update middleware.ts** -- Rewrite `apps/web/src/middleware.ts`:
   - Platform admins (cookie-based platformRole check) -> redirect to `/admin/dashboard`
   - Org members with org_type cookie -> redirect to `/hospital/dashboard` or `/provider/dashboard`
   - Block cross-portal access (hospital user cannot access /provider/*)
   - Preserve returnTo parameter for post-login redirects
2. **Update auth middleware constants** -- `packages/auth/src/middleware.ts`:
   - Replace stale PROTECTED_ROUTES (staff/student) with hospital/provider/admin
   - Update PUBLIC_PATHS if needed
3. **Add portal redirect helpers** -- `apps/web/src/lib/portal-routing.ts`:
   - `getPortalForUser(cookies)` -- determine target portal from cookies
   - `buildPortalRedirect(portal, pathname)` -- construct redirect URL
   - `isPortalPath(pathname)` -- check if path belongs to a portal
   - `getPortalFromPath(pathname)` -- extract portal from URL

### Key Files
- `apps/web/src/middleware.ts`
- `packages/auth/src/middleware.ts`
- `apps/web/src/lib/portal-routing.ts`

### Dependencies
- All previous waves (portal routes must exist)

### Edge Runtime Constraint

Middleware runs in Edge Runtime and CANNOT call Convex directly. Strategy:
- Better Auth session API returns user data including platformRole
- Org type stored in a cookie (`medilink-org-type`) set during organization activation
- If org_type cookie missing, redirect to a client-side org-selection page that can query Convex

---

## Verification

After all waves complete:

```bash
# TypeScript check (must pass with zero errors)
pnpm typecheck

# Lint check
pnpm lint

# Build check (ensure all route groups compile)
pnpm build

# Manual verification:
# 1. Navigate to /sign-in -- auth layout renders
# 2. Navigate to /sign-up -- org type selector visible
# 3. Navigate to /hospital/dashboard -- hospital sidebar renders
# 4. Navigate to /provider/dashboard -- provider sidebar renders
# 5. Navigate to /admin/dashboard -- admin sidebar renders
# 6. Resize to mobile -- Sheet-based nav appears
# 7. Toggle theme -- dark/light works in all portals
```

---

## Architecture Decisions

1. **Single reusable layout pattern**: Sidebar/Header/MobileNav accept NavItem[] rather than hardcoding per portal. This enables future portals without new layout components.

2. **Cookie-based portal routing**: Since Edge middleware cannot query Convex, org_type is stored in a cookie during organization activation. This adds a cookie dependency but enables fast edge routing.

3. **Bilingual labels centralized**: All strings in `lib/i18n/` modules with `{ vi, en }` objects. Components accept a `locale` prop (default "vi") for rendering.

4. **Server Components by default**: Portal layouts and dashboard stubs are Server Components. Only Sidebar collapse toggle, MobileNav Sheet, auth forms, and Header user menu need `"use client"`.

5. **PROTECTED_ROUTES update**: Replacing legacy staff/student route constants with hospital/provider/admin to match the B2B SaaS portal model.
