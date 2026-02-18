# PLAN.md -- M0-6 Post-Merge Follow-Up

## Summary

Fix 2 CRITICAL bugs (sign-up redirect loop, cross-portal enforcement), 3 HIGH issues (sign-in callbackURL, Header dead prop, PortalLayout client bundle), and 1 MEDIUM cleanup (dead exports). Organized into 5 sequential waves prioritized by severity.

**Total estimates**: ~100 minutes across 5 waves, 15 features, 10 files affected.

---

## Wave 1: Fix Sign-Up Redirect Loop (CRITICAL)

**Objective**: Fix the infinite redirect loop caused by missing `organization.setActive()` call after organization creation in sign-up flow.

**WHY**: After `organization.create()` succeeds, the session still has `activeOrganizationId=null` because `setActive()` is never called. Middleware Branch 3 sees null org and redirects back to `/sign-up`, creating an infinite loop. This is the most critical bug blocking all new user registration.

**Complexity**: low | **Model**: sonnet | **Estimate**: 15 min

### Tasks
- [1.1] Add `organization.setActive()` after org creation in `sign-up/page.tsx`
- [1.2] Add error handling for `setActive` failure with user-facing error

### Files
- `apps/web/src/app/(auth)/sign-up/page.tsx`

### Implementation Detail

In `handleSubmit()`, after `organization.create()` succeeds (line 84), insert:

```typescript
// Step 3: Activate the new organization in the session
const setActiveResult = await organization.setActive({
  organizationId: orgResult.data!.id,
});

if (setActiveResult.error) {
  setError(labels.errorGeneric.vi);
  setIsLoading(false);
  return;
}
```

This ensures `activeOrganizationId` is populated in the session before `router.push()`, so middleware Branch 3 will not redirect back to `/sign-up`.

---

## Wave 2: Cross-Portal Enforcement (CRITICAL)

**Objective**: Enforce that hospital users can only access `/hospital/*` routes and provider users can only access `/provider/*` routes.

**WHY**: Currently middleware Branch 4 just calls `NextResponse.next()` for any authenticated user with an active organization, meaning a hospital user can freely access `/provider/*` routes and vice versa. This is a security boundary violation.

**Complexity**: medium | **Model**: sonnet | **Estimate**: 30 min

### Tasks
- [2.1] Extend `getSessionData()` to extract `orgType` from `session.activeOrganization.metadata.org_type`
- [2.2] Populate `orgType` field in `MiddlewareSessionData` return value
- [2.3] Add `validatePortalAccess()` helper in `portal-routing.ts`
- [2.4] Enforce cross-portal check in middleware Branch 4; fix root path redirect

### Files
- `apps/web/src/middleware.ts`
- `apps/web/src/lib/portal-routing.ts`

### Implementation Detail

**middleware.ts -- getSessionData()**:
```typescript
const data = (await response.json()) as {
  user?: { id?: string; platformRole?: string | null } | null;
  session?: {
    id?: string;
    activeOrganizationId?: string | null;
    activeOrganization?: {
      metadata?: { org_type?: string } | null;
    } | null;
  } | null;
} | null;

return {
  platformRole: data.user?.platformRole ?? null,
  activeOrganizationId: data.session?.activeOrganizationId ?? null,
  orgType: (data.session?.activeOrganization?.metadata?.org_type as string) ?? null,
};
```

**portal-routing.ts -- validatePortalAccess()**:
```typescript
export function getExpectedOrgTypeForPortal(portal: PortalType): string | null {
  switch (portal) {
    case "hospital": return "hospital";
    case "provider": return "provider";
    default: return null; // platform-admin checked via platformRole, not orgType
  }
}
```

**middleware.ts -- Branch 4**:
```typescript
// Branch 4: Has active org -- validate portal access
if (pathname === "/") {
  // Redirect to correct dashboard based on org type
  const dashboard = sessionData.orgType === "provider"
    ? "/provider/dashboard"
    : "/hospital/dashboard";
  return NextResponse.redirect(new URL(dashboard, request.url));
}

const expectedOrgType = getExpectedOrgTypeForPortal(currentPortal);
if (expectedOrgType && sessionData.orgType !== expectedOrgType) {
  const correctDashboard = getDefaultRedirectForPortal(
    sessionData.orgType === "provider" ? "provider" : "hospital"
  );
  return NextResponse.redirect(new URL(correctDashboard, request.url));
}

return NextResponse.next();
```

---

## Wave 3: Sign-In CallbackURL + Header Cleanup (HIGH)

**Objective**: Fix sign-in page to respect the `returnTo` query parameter and remove unused `navItems` prop from Header.

**WHY**: The middleware correctly sets `returnTo` when redirecting unauthenticated users, but sign-in ignores it and always routes to `/hospital/dashboard`. The Header navItems cleanup is grouped here because both are small, low-risk changes.

**Complexity**: low | **Model**: sonnet | **Estimate**: 15 min

### Tasks
- [3.1] Read `returnTo` param in sign-in page using `useSearchParams`
- [3.2] Wrap sign-in form in `Suspense` boundary (Next.js requirement for `useSearchParams`)
- [3.3] Remove `navItems` from `HeaderProps` interface and `<Header>` call in portal-layout

### Files
- `apps/web/src/app/(auth)/sign-in/page.tsx`
- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/components/layout/portal-layout.tsx`

---

## Wave 4: PortalLayout Server Component Refactor (HIGH)

**Objective**: Convert PortalLayout to a server component by extracting mobile nav state into a dedicated client component.

**WHY**: The `"use client"` directive on PortalLayout forces all children into the client bundle, increasing JS payload. The only client state is a single boolean for mobile nav visibility.

**Complexity**: medium | **Model**: sonnet | **Estimate**: 25 min

### Tasks
- [4.1] Create `MobileNavController` client component
- [4.2] Convert `PortalLayout` to server component
- [4.3] Update barrel export in `layout/index.ts`

### Files
- `apps/web/src/components/layout/mobile-nav-controller.tsx` (NEW)
- `apps/web/src/components/layout/portal-layout.tsx`
- `apps/web/src/components/layout/index.ts`

### Implementation Note

The `MobileNavController` takes `navItems`, `orgName`, `locale`, and `children` as props. It owns the `mobileNavOpen` useState and renders the exact same JSX tree that `PortalLayout` currently renders (Sidebar, Header, main, MobileNav). The updated `PortalLayout` becomes:

```typescript
// No "use client" directive
import { MobileNavController } from "./mobile-nav-controller";

export function PortalLayout({ children, navItems, orgName, locale = "vi" }: PortalLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <MobileNavController navItems={navItems} orgName={orgName} locale={locale}>
        {children}
      </MobileNavController>
    </div>
  );
}
```

Note: After Wave 3 removes `navItems` from HeaderProps, the `<Header>` in MobileNavController will NOT pass navItems.

---

## Wave 5: Dead Code Cleanup + Verification (MEDIUM)

**Objective**: Remove unused exports and run full typecheck + build to verify all changes.

**WHY**: Dead exports add confusion. Final verification ensures all waves integrate correctly.

**Complexity**: low | **Model**: sonnet | **Estimate**: 15 min

### Tasks
- [5.1] Remove `PROTECTED_ROUTES` and `requiresAuth` from `packages/auth/src/middleware.ts`
- [5.2] Run `pnpm typecheck` across monorepo
- [5.3] Run `pnpm build` to verify production build

### Files
- `packages/auth/src/middleware.ts`

---

## Execution Summary

| Wave | Priority | Files | Features | Estimate |
|------|----------|-------|----------|----------|
| 1 | CRITICAL | 1 | 2 | 15 min |
| 2 | CRITICAL | 2 | 4 | 30 min |
| 3 | HIGH | 3 | 3 | 15 min |
| 4 | HIGH | 3 | 3 | 25 min |
| 5 | MEDIUM | 1 | 3 | 15 min |
| **Total** | | **10** | **15** | **~100 min** |

## Verification Strategy

Since the project does not have a test framework established yet, verification relies on:
1. `pnpm typecheck` -- TypeScript compilation across all workspaces
2. `pnpm build` -- Full Next.js production build (catches SSR/CSR issues)
3. `pnpm lint` -- ESLint validation
4. Manual flow verification (sign-up, sign-in, cross-portal redirect)
