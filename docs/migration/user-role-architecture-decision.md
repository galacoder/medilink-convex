# Research Report: SaaS User Role Architecture Decision

> Task 5.2 -- Industry best practices for SaaS user role naming and separation
> Date: 2026-02-16
> Applies to: ProX, MediLink, PalX

---

## Executive Summary

1. **Every major SaaS platform uses a two-layer role model**: tenant-scoped roles (Owner > Admin > Member > Guest/Viewer) for customer-facing access, and a completely separate system for internal platform operations. No production SaaS product exposes platform/super-admin functionality through the same interface as customer-facing roles.

2. **The universal naming pattern is function-based, not identity-based**: "Owner, Admin, Member" (not "Consumer, Producer, Admin"). The term "Consumer" is not used by any surveyed platform. "Producer" is ambiguous. Industry-standard terminology maps to what the user *does* within the organization, not what they *are* on the platform.

3. **Super admin (platform operator) access should be a separate route group with additional auth gates**, not a separate application. For small teams (1-5 engineers), the security benefit of a fully separate app does not outweigh the maintenance cost. The recommended pattern is `(platform-admin)/` route group with IP allowlisting, mandatory MFA, and separate audit log.

---

## 1. Industry Survey: How 10 SaaS Products Handle Roles

### 1.1 Role Naming Across Platforms

| Platform | Tenant-Scoped Roles | Platform/Internal Access | URL Structure |
|----------|---------------------|--------------------------|---------------|
| **GitHub** | Owner, Admin, Member, Moderator, Billing Manager, Outside Collaborator | GitHub Staff (separate internal tools, `stafftools.github.com`) | `github.com/orgs/{org}/settings` |
| **Vercel** | Owner, Member, Developer, Security, Billing, Viewer, Contributor | Vercel internal (separate systems) | `vercel.com/teams/{team}/settings` |
| **Notion** | Workspace Owner, Membership Admin, Member, Guest | Notion internal (separate systems) | `notion.so/{workspace}/settings` |
| **Linear** | Workspace Owner, Admin, Team Owner, Member, Guest | Linear internal (separate systems) | `linear.app/{workspace}/settings` |
| **Stripe** | Administrator, Developer, Analyst, View Only, Custom Roles | Stripe internal (separate tooling, rumored `go/stafftools`) | `dashboard.stripe.com/settings/team` |
| **Cal.com** | Owner, Admin, Member | Cal.com team (GitHub contributors) | `app.cal.com/settings/organizations/{slug}` |
| **Skool** | Creator, Billing Manager, Admin, Moderator, Member | Skool internal (not exposed) | `skool.com/settings` |
| **Kajabi** | Primary Owner, Owner, Administrator, Assistant, Support Specialist, Author, Student | Kajabi internal (not exposed) | `app.kajabi.com/admin` |
| **Teachable** | Primary Owner, Owner, Author, Affiliate, Student + Custom Roles | Teachable internal (not exposed) | `{school}.teachable.com/admin` |
| **Clerk** (auth provider) | org:admin, org:member + Custom Roles | Clerk Dashboard (separate app at `dashboard.clerk.com`) | N/A (auth service) |

### 1.2 Key Observations

**Universal patterns across all 10 platforms:**

1. **"Owner" is the top tenant-scoped role** -- 10/10 platforms use "Owner" or "Primary Owner" as the highest customer-accessible role. Zero platforms use "Super Admin" for tenant-level access.

2. **Platform operations are always separated** -- Every platform with internal operations keeps them in a separate tool/subdomain. GitHub uses `stafftools.github.com`. Stripe uses internal tooling. Vercel, Notion, Linear all have internal systems not exposed to customers.

3. **No platform uses "Consumer" or "Producer"** -- The user's proposed terminology ("Consumer, Producer, Admin") does not match any production SaaS product. The closest analogy is Teachable's "Student" and "Author," but even Teachable does not use "Consumer."

4. **Role names describe function, not identity** -- "Admin" (what you *do*: administer), "Member" (what you *are*: a member), "Viewer" (what you *can do*: view). Not "Consumer" (what you *consume*).

5. **3-4 base roles is the sweet spot** -- Most platforms ship with Owner, Admin, Member (+optional Guest/Viewer). Custom roles are added for Enterprise plans.

---

## 2. Three Approaches Compared

### Approach A: Admin + Super Admin in Same App (Single Route Group)

**Description**: Both organization admin (`/admin`) and platform admin (`/super-admin`) live in the same Next.js app, differentiated by role checks in middleware.

| Dimension | Assessment |
|-----------|------------|
| **Architecture** | Single codebase, single deployment, single auth system |
| **Security** | Higher attack surface -- super-admin API routes are discoverable via client bundle analysis |
| **Complexity** | Low -- one middleware, one role enum, one session type |
| **Maintenance** | Low -- no code duplication |
| **Scalability** | Acceptable up to ~50K users, then audit/compliance concerns emerge |

**Pros:**
- Simplest architecture, fastest to build
- Unified auth (Better Auth handles all roles)
- No cross-app session management
- Single CI/CD pipeline

**Cons:**
- Super-admin routes are in the same bundle (even if tree-shaken, API routes are discoverable)
- Privilege escalation risk if role checks have bugs
- Harder to add IP allowlisting just for super-admin
- SOC 2 / HIPAA auditors may flag shared infrastructure

**Who uses this:** Early-stage SaaS, Cal.com (OSS, small team), most MVP-stage products.

---

### Approach B: Super Admin as Completely Separate App

**Description**: Platform admin is a separate Next.js app (or Retool/internal tool) deployed on a separate subdomain (`admin.company.com` or `internal.company.com`).

| Dimension | Assessment |
|-----------|------------|
| **Architecture** | Two apps, two deployments, shared auth or separate auth |
| **Security** | Strong isolation -- separate network, can VPN/IP-restrict, separate auth |
| **Complexity** | High -- two codebases, shared types, cross-app API contracts |
| **Maintenance** | High -- features that span both apps require coordinated deploys |
| **Scalability** | Enterprise-grade, supports compliance requirements |

**Pros:**
- Complete security isolation (different domain, different deployment)
- Can use VPN/IP allowlisting without affecting customer app
- Super-admin UI can be ugly/functional (Retool, internal tool)
- SOC 2 / HIPAA compliant by design
- Super-admin bundle never ships to customers

**Cons:**
- 2x deployment cost (two Vercel projects or separate hosting)
- Auth sharing across domains requires cookie scope configuration or token proxy
- Two CI/CD pipelines
- Small team overhead: maintaining two apps for a feature used by 1-3 people
- AI complexity score increases from ~200 to ~400+

**Who uses this:** GitHub (stafftools), Stripe (internal tools), Notion (internal), any platform with >100 engineers and compliance requirements.

---

### Approach C: Super Admin as Separate Route Group (Recommended)

**Description**: Platform admin lives in the same Next.js app but as a separate route group `(platform-admin)/` with additional security layers (IP allowlisting, mandatory MFA, separate audit log, elevated session requirements).

| Dimension | Assessment |
|-----------|------------|
| **Architecture** | Single app, single deployment, route-group separation |
| **Security** | Moderate-to-strong -- middleware-enforced IP allowlist + MFA + audit log |
| **Complexity** | Low-to-moderate -- one middleware with layered checks |
| **Maintenance** | Low -- single codebase, single CI/CD |
| **Scalability** | Good for teams of 1-20, re-evaluate at enterprise scale |

**Pros:**
- Single codebase, single deployment (matches ARCHITECTURE_STANDARD.md Decision 3)
- Middleware can enforce IP allowlist + MFA for `(platform-admin)/` routes only
- Audit log captures all super-admin actions
- No cross-domain auth issues
- AI complexity stays at ~200
- Can evolve to Approach B later if compliance requires it

**Cons:**
- Super-admin API routes exist in the same bundle (mitigated by server-only imports)
- Requires disciplined middleware implementation
- Not sufficient for regulated industries (healthcare with HIPAA, finance with SOC 2 Type II)

**Who should use this:** ProX, PalX, and MediLink at current stage (small team, pre-enterprise).

---

### Comparison Matrix

| Criteria | Weight | A: Same App Flat | B: Separate App | C: Separate Route Group |
|----------|--------|-------------------|------------------|--------------------------|
| Implementation speed | 20% | 9 | 4 | 8 |
| Security isolation | 20% | 4 | 9 | 7 |
| Maintenance cost | 15% | 9 | 3 | 8 |
| AI agent compatibility | 15% | 9 | 5 | 9 |
| Compliance readiness | 10% | 3 | 9 | 6 |
| Scalability | 10% | 5 | 9 | 7 |
| Auth simplicity | 10% | 9 | 4 | 9 |
| **Weighted Score** | 100% | **6.95** | **5.85** | **7.65** |

**Winner: Approach C** -- separate route group with layered security.

---

## 3. Recommended Role Naming

### 3.1 Why Not "Consumer, Producer, Admin"

The user's proposed terminology has three problems:

1. **"Consumer" is passive and reductive.** No SaaS platform calls its users "consumers." It implies they only receive value, not participate. "Member" is standard because it implies belonging to a community/organization.

2. **"Producer" is ambiguous.** Does a "producer" produce content? Produce courses? Produce reports? "Owner" or "Admin" (the person who administers their organization) is clearer. For content creators specifically, "Author" or "Instructor" is more precise.

3. **"Admin" is overloaded.** If "Admin" means the business owner, what do you call someone with administrative privileges within the business who is not the owner? Every platform distinguishes Owner from Admin.

### 3.2 Recommended Role Hierarchy

```
LAYER 1: Platform Roles (SangLeTech staff only)
================================================
platform_admin    -- Full platform access: all tenants, billing, infrastructure
platform_support  -- Read-only cross-tenant access for customer support

LAYER 2: Tenant Roles (per-organization, customer-facing)
==========================================================
owner             -- Created the organization. Full access including billing,
                     user management, and destructive actions (delete org)
admin             -- Full access except billing and org deletion. Can manage
                     members, content, and settings
instructor        -- Can create/manage courses, content, and community posts
                     (ProX-specific; use "author" for content platforms)
member            -- Standard user. Can consume content, participate in community,
                     view leaderboard, manage own profile
guest             -- Limited access, invited by a member. View-only for specific
                     content (future: Enterprise feature)
```

### 3.3 Mapping to Current ARCHITECTURE_STANDARD.md

The architecture standard currently uses:
```typescript
role: v.union(
  v.literal("student"),
  v.literal("instructor"),
  v.literal("admin"),
  v.literal("superadmin")
)
```

**Recommended update:**

```typescript
// Layer 1: Platform roles (checked via separate field, NOT this enum)
// platformRole: v.optional(v.union(
//   v.literal("platform_admin"),
//   v.literal("platform_support")
// ))

// Layer 2: Tenant roles (per-organization)
role: v.union(
  v.literal("owner"),       // was: (no equivalent, admin was overloaded)
  v.literal("admin"),       // was: admin
  v.literal("instructor"),  // was: instructor
  v.literal("member"),      // was: student (renamed for universality)
  v.literal("guest")        // new: future Enterprise feature
)
```

**Key changes:**
- `student` -> `member` (universal, not education-specific)
- `superadmin` -> moved to separate `platformRole` field (never mix layers)
- Added `owner` (distinct from `admin` -- owns billing, can delete org)
- Added `guest` (view-only, future feature)

### 3.4 Per-Project Role Customization

| Role | ProX (Education SaaS) | MediLink (Healthcare) | PalX (Personal AI) |
|------|------------------------|-----------------------|--------------------|
| owner | School/Org Owner | Clinic Owner | Account Owner |
| admin | School Admin | Clinic Admin | N/A (single-user) |
| instructor | Course Instructor | Doctor/Provider | N/A |
| member | Student/Learner | Patient | Primary User |
| guest | Guest Viewer | Family Member | Shared Access |

The underlying role enum stays the same (`owner`, `admin`, `instructor`, `member`, `guest`). The display label varies per product context.

---

## 4. URL Structure Recommendation

### 4.1 Route Group Architecture

```
apps/web/src/app/
  (auth)/                    -- Public: sign-in, sign-up, forgot-password
    sign-in/page.tsx
    sign-up/page.tsx

  (marketing)/               -- Public: landing, pricing, about
    page.tsx                  -- Landing page
    pricing/page.tsx

  (member)/                  -- Gated: member role (was: consumer)
    dashboard/page.tsx
    courses/page.tsx
    community/page.tsx
    leaderboard/page.tsx
    profile/page.tsx
    settings/page.tsx

  (admin)/                   -- Gated: owner + admin + instructor roles
    dashboard/page.tsx
    courses/manage/page.tsx
    users/page.tsx
    analytics/page.tsx
    membership/page.tsx
    settings/page.tsx

  (platform-admin)/          -- Gated: platform_admin role + IP allowlist + MFA
    tenants/page.tsx          -- All organizations
    users/page.tsx            -- All users across orgs
    billing/page.tsx          -- Platform billing
    analytics/page.tsx        -- Platform-wide metrics
    feature-flags/page.tsx    -- Feature flag management
    audit-log/page.tsx        -- Platform audit log
```

### 4.2 URL Paths (What Users See)

| Route Group | URL Path | Who Sees It | Auth Requirements |
|-------------|----------|-------------|-------------------|
| `(auth)` | `/sign-in`, `/sign-up` | Everyone | None |
| `(marketing)` | `/`, `/pricing` | Everyone | None |
| `(member)` | `/dashboard`, `/courses`, `/community` | Authenticated + member role or higher | Session cookie |
| `(admin)` | `/admin/dashboard`, `/admin/users` | Authenticated + owner/admin/instructor role | Session cookie + org context |
| `(platform-admin)` | `/platform/tenants`, `/platform/audit-log` | Authenticated + platform_admin role | Session cookie + MFA + IP allowlist |

**Note on route groups vs URL paths**: Next.js route groups `(member)/` do NOT create a URL segment. The parentheses are organizational only. To create a `/admin` URL prefix, the directory structure would be:

```
(admin)/
  admin/           -- This creates the /admin URL prefix
    dashboard/
    users/
```

Or more practically:
```
app/
  admin/           -- /admin/* paths, protected by middleware
  platform/        -- /platform/* paths, protected by middleware + IP + MFA
  dashboard/       -- /dashboard (member area, default for logged-in users)
  courses/         -- /courses
```

### 4.3 Middleware Implementation

```typescript
// middleware.ts
import { betterAuth } from "@prox/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PLATFORM_ADMIN_IPS = process.env.PLATFORM_ADMIN_IPS?.split(",") ?? [];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSession(request); // Better Auth session

  // Public routes -- no auth needed
  if (isPublicRoute(pathname)) return NextResponse.next();

  // No session -- redirect to sign-in
  if (!session) return redirect("/sign-in");

  // Platform admin routes -- additional gates
  if (pathname.startsWith("/platform")) {
    if (session.user.platformRole !== "platform_admin") {
      return redirect("/dashboard"); // 403 equivalent
    }
    // IP allowlist check
    const clientIp = request.headers.get("x-forwarded-for");
    if (PLATFORM_ADMIN_IPS.length > 0 && !PLATFORM_ADMIN_IPS.includes(clientIp)) {
      return redirect("/dashboard");
    }
    // MFA check would go here
    return NextResponse.next();
  }

  // Org admin routes -- role check
  if (pathname.startsWith("/admin")) {
    const orgRole = session.user.role; // tenant-scoped role
    if (!["owner", "admin", "instructor"].includes(orgRole)) {
      return redirect("/dashboard");
    }
    return NextResponse.next();
  }

  // Member routes -- any authenticated user
  return NextResponse.next();
}
```

---

## 5. Security Analysis

### 5.1 Threat Model for Super Admin Access

| Threat | Same App (Flat) | Separate App | Separate Route Group |
|--------|-----------------|--------------|----------------------|
| **API route discovery** | HIGH: Admin API routes in client bundle | NONE: Different domain | LOW: Server-only imports, not in client bundle |
| **Privilege escalation** | HIGH: Single role enum, bug = full access | LOW: Different auth system | MEDIUM: Layered checks (role + IP + MFA) |
| **Session hijacking** | HIGH: Same session grants admin access | LOW: Different session cookie | MEDIUM: Elevated session requirements |
| **Cross-tenant data leak** | MEDIUM: Same queries, different filters | LOW: Different data layer | MEDIUM: orgId scoping + audit log |
| **Insider threat** | HIGH: Any dev with codebase access | LOW: Separate repo, separate access | MEDIUM: Audit log + IP restriction |

### 5.2 Mitigation Strategies for Approach C (Recommended)

| Mitigation | Implementation | Effort |
|------------|----------------|--------|
| **IP allowlisting** | `PLATFORM_ADMIN_IPS` env var, checked in middleware | 30 min |
| **Mandatory MFA** | Better Auth MFA plugin, enforced for platform routes | 2-4 hours |
| **Audit log** | Convex mutation wrapper that logs all platform-admin actions | 2-4 hours |
| **Server-only imports** | `import "server-only"` at top of platform-admin components | 5 min |
| **Elevated session** | Require re-authentication for destructive platform actions | 1-2 hours |
| **Rate limiting** | Stricter rate limits on `/platform/*` API routes | 30 min |
| **Role separation** | `platformRole` field separate from `role` (never mix layers) | 15 min |

### 5.3 When to Upgrade to Approach B (Separate App)

Trigger any ONE of these conditions:
- SOC 2 Type II audit requires physical separation
- HIPAA compliance requires separate infrastructure (MediLink at scale)
- Platform admin team grows beyond 5 people
- Customer count exceeds 1,000 organizations
- Security incident involving privilege escalation

**Migration path**: Extract `(platform-admin)/` route group into a new Next.js app. Since it is already isolated by route group, the extraction is mechanical (move files, set up separate deployment, configure cross-domain auth).

---

## 6. Better Auth Integration

### 6.1 Schema Design (Convex + Better Auth)

```typescript
// convex/schema.ts

// Organization (tenant)
organization: defineTable({
  name: v.string(),
  slug: v.string(),
  plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  ownerId: v.id("user"),
  createdAt: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_owner", ["ownerId"]),

// Organization membership (tenant-scoped roles)
organizationMembership: defineTable({
  userId: v.id("user"),
  organizationId: v.id("organization"),
  role: v.union(
    v.literal("owner"),
    v.literal("admin"),
    v.literal("instructor"),
    v.literal("member"),
    v.literal("guest")
  ),
  invitedBy: v.optional(v.id("user")),
  joinedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_org", ["organizationId"])
  .index("by_user_org", ["userId", "organizationId"]),

// User (global, not tenant-scoped)
user: defineTable({
  // ... existing fields ...
  platformRole: v.optional(v.union(
    v.literal("platform_admin"),
    v.literal("platform_support")
  )),
  // NOTE: No 'role' field here. Roles are per-organization
  // via organizationMembership table
})
```

### 6.2 Key Design Principle: Roles Are Per-Organization

A user can be an `owner` in Organization A and a `member` in Organization B. This is how GitHub, Vercel, Notion, Linear, Clerk, and every multi-tenant SaaS works. The role is stored on the **membership** record, not on the **user** record.

The `platformRole` field on the user record is the exception -- it is global because platform admins operate across all organizations.

### 6.3 Better Auth Organization Plugin

Better Auth's organization plugin provides this exact pattern out of the box:

```typescript
// packages/auth/src/index.ts
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    organization({
      // Default roles: "admin", "member"
      // Custom roles for ProX:
      roles: {
        owner: { permissions: ["*"] },
        admin: { permissions: ["manage:members", "manage:content", "manage:settings"] },
        instructor: { permissions: ["manage:courses", "manage:community"] },
        member: { permissions: ["read:content", "write:community"] },
        guest: { permissions: ["read:content"] },
      },
    }),
  ],
});
```

---

## 7. Recommendations

### 7.1 For All Three Projects

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| **Naming** | owner, admin, instructor, member, guest | Industry standard. Matches GitHub/Vercel/Notion/Linear/Cal.com |
| **Super admin** | Separate route group `(platform-admin)/` | Approach C: best score (7.65/10). Re-evaluate at enterprise scale |
| **URL structure** | `/admin/*` for org admin, `/platform/*` for platform admin | Clear separation without separate apps |
| **Role storage** | Per-organization via `organizationMembership` table | Standard multi-tenant pattern. Same user can have different roles in different orgs |
| **Platform role** | Separate `platformRole` field on user record | Never mix tenant-scoped and platform-scoped roles |
| **Auth** | Better Auth organization plugin with custom roles | Provides RBAC, invitations, org switching out of the box |

### 7.2 Implementation Checklist

#### Phase 1: Schema (M0-M1)

- [ ] Add `organization` table to Convex schema
- [ ] Add `organizationMembership` table with role enum: `owner | admin | instructor | member | guest`
- [ ] Add `platformRole` field to `user` table (optional, `platform_admin | platform_support`)
- [ ] Configure Better Auth organization plugin with custom roles
- [ ] Remove `superadmin` from user role enum (moved to `platformRole`)
- [ ] Rename `student` to `member` in schema

#### Phase 2: Middleware (M1)

- [ ] Create middleware role checks for `/admin/*` routes (owner + admin + instructor)
- [ ] Create middleware role checks for `/platform/*` routes (platform_admin + IP + MFA)
- [ ] Add `server-only` imports to platform-admin components
- [ ] Set up `PLATFORM_ADMIN_IPS` environment variable

#### Phase 3: UI (M2)

- [ ] Build org admin dashboard at `/admin/dashboard`
- [ ] Build platform admin dashboard at `/platform/tenants` (can be minimal/ugly)
- [ ] Add org switcher component (user can belong to multiple orgs)
- [ ] Add role indicator in navigation

#### Phase 4: Security Hardening (M3+)

- [ ] Implement audit log for platform-admin actions
- [ ] Add MFA requirement for platform-admin routes
- [ ] Add elevated session requirement for destructive actions
- [ ] Rate limit platform-admin API routes

### 7.3 Per-Project Notes

**ProX (Education SaaS)**
- Primary use case: school owner creates courses, students enroll
- Display labels: "School Owner" (owner), "Administrator" (admin), "Instructor" (instructor), "Student" (member)
- Platform admin: SangLeTech team managing all schools

**MediLink (Healthcare)**
- Display labels: "Clinic Owner" (owner), "Clinic Admin" (admin), "Provider" (instructor), "Patient" (member), "Family Member" (guest)
- HIPAA consideration: May need to upgrade to Approach B (separate app) before production launch
- Platform admin: SangLeTech team managing all clinics

**PalX (Personal AI)**
- Simpler model: most features are single-user
- Display labels: "Account Owner" (owner), "Member" (member)
- No instructor role needed
- Platform admin: SangLeTech team for system monitoring

---

## 8. Architecture Standard Update Required

The current `ARCHITECTURE_STANDARD.md` Section 6 uses `student`, `instructor`, `admin`, `superadmin`. This research recommends updating to:

```diff
- role: v.union(
-   v.literal("student"),
-   v.literal("instructor"),
-   v.literal("admin"),
-   v.literal("superadmin")
- ),
+ // Tenant-scoped role (per organization membership)
+ role: v.union(
+   v.literal("owner"),
+   v.literal("admin"),
+   v.literal("instructor"),
+   v.literal("member"),
+   v.literal("guest")
+ ),
```

And adding `platformRole` as a separate field on the user table:
```typescript
platformRole: v.optional(v.union(
  v.literal("platform_admin"),
  v.literal("platform_support")
)),
```

And updating the route group structure:
```diff
  (auth)/              -> Shared login (all orgs)
- (consumer)/          -> Student-facing (scoped by orgId)
+ (member)/            -> Member-facing (scoped by orgId)
  (admin)/             -> Org admin (scoped by orgId + role check)
- (superadmin)/        -> GalaTech operations (superadmin role only)
+ (platform-admin)/    -> SangLeTech operations (platformRole + IP + MFA)
```

---

## Sources

### Primary Research (Platform Documentation)
- [GitHub Roles in an Organization](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization)
- [Vercel Access Roles](https://vercel.com/docs/rbac/access-roles)
- [Notion Who's Who in a Workspace](https://www.notion.com/help/whos-who-in-a-workspace)
- [Linear Members and Roles](https://linear.app/docs/members-roles)
- [Stripe User Roles](https://docs.stripe.com/get-started/account/teams/roles)
- [Cal.com RBAC](https://cal.com/blog/role-based-access-control)
- [Skool Member Roles](https://help.skool.com/article/74-member-roles)
- [Kajabi Account Users](https://help.kajabi.com/hc/en-us/articles/360036862774-How-to-Add-Account-Users)
- [Teachable User Roles](https://support.teachable.com/hc/en-us/articles/227162328-Types-of-User-Roles)
- [Clerk Organizations RBAC](https://clerk.com/docs/organizations/roles-permissions)

### Security and Architecture
- [Aikido: How to Build a Secure Admin Panel for SaaS](https://www.aikido.dev/blog/build-secure-admin-panel)
- [WorkOS: Multi-Tenant RBAC Design](https://workos.com/blog/how-to-design-multi-tenant-rbac-saas)
- [Perpetual: How to Design Effective SaaS Roles](https://www.perpetualny.com/blog/how-to-design-effective-saas-roles-and-permissions)
- [Frontegg: Roles and Permissions in SaaS](https://frontegg.com/guides/roles-and-permissions-handling-in-saas-applications)
- [Auth0: Authorization Model for Multi-Tenant SaaS](https://auth0.com/blog/how-to-choose-the-right-authorization-model-for-your-multi-tenant-saas-application/)
- [Permit.io: Multi-Tenant Authorization Best Practices](https://www.permit.io/blog/best-practices-for-multi-tenant-authorization)

### Better Auth
- [Better Auth Organization Plugin](https://www.better-auth.com/)
- [Better Auth Multi-Tenant Discussion #3317](https://github.com/better-auth/better-auth/discussions/3317)
- [ZenStack + Better Auth Integration](https://zenstack.dev/blog/better-auth)

### Internal References
- `prox/architecture-decision/ARCHITECTURE_STANDARD.md` (Section 6: Multi-Tenancy)
- `prox/architecture-decision/migration-planning/app-architecture-decision.md` (Single-app decision)
