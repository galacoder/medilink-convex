# User Flows, Convex Schemas, and Cross-Functional Requirements

> Comprehensive documentation for ProX, MediLink, and PalX covering user journeys, database schemas, RBAC, multi-tenancy, and integration patterns.

**Date**: 2026-02-16
**Wave**: 6 - Standards & Issue Updates (Task 6.4)
**Standard**: ARCHITECTURE_STANDARD.md v2 (T3 Turbo + Convex)
**Source**: Wave 5 feature specifications (139 issues, 34 feature groups), Wave 6 tasks 1-3

---

## Table of Contents

1. [Part 1: User Journey Flows](#part-1-user-journey-flows)
   - [Consumer Journey](#1-consumer-journey)
   - [Producer Journey](#2-producer-journey)
   - [Admin Journey](#3-admin-journey)
2. [Part 2: Convex Schema Documentation](#part-2-convex-schema-documentation)
   - [ProX Schema](#prox-schema)
   - [MediLink Schema](#medilink-schema)
   - [PalX Schema](#palx-schema)
3. [Part 3: Cross-Functional Requirements](#part-3-cross-functional-requirements)
   - [Authentication (Better Auth)](#authentication-better-auth)
   - [RBAC (Role-Based Access Control)](#rbac-role-based-access-control)
   - [Multi-Tenancy Patterns](#multi-tenancy-patterns)
   - [Error Handling & Notifications](#error-handling--notifications)
   - [Testing Strategy](#testing-strategy)
4. [Part 4: Integration Points Between Projects](#part-4-integration-points-between-projects)

---

# Part 1: User Journey Flows

Three complete user journeys mapped across all three projects, aligned with the 5-role hierarchy (owner, admin, instructor, member, guest) and route group architecture ((auth)/, (member)/, (admin)/, (super)/).

---

## 1. Consumer Journey

Consumers are the primary end-users of each platform: students (ProX), hospital staff (MediLink), and personal users (PalX). These users hold the **member** role within their organization.

### 1.1 Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: DISCOVERY                                               │
│ User arrives at landing page via marketing, referral, or search │
│ Route: (marketing)/ -> /                                        │
│ Projects: ProX (course landing), MediLink (product page),       │
│           PalX (AI assistant demo)                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: SIGN UP                                                 │
│ Route: (auth)/sign-up                                           │
│ Method: Email/password, Google OAuth, or Magic Link             │
│ Better Auth creates: user, session, account records             │
│ Default role: member                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: EMAIL VERIFICATION                                      │
│ Better Auth sends verification email                            │
│ Convex table: verification (token, identifier, expiresAt)       │
│ User clicks link -> emailVerified = true                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: ORGANIZATION CONTEXT                                    │
│                                                                  │
│ ProX: Auto-join organization via invite link OR create new org  │
│       -> organizationMembership created (role: member)          │
│                                                                  │
│ MediLink: Admin invites user to hospital organization           │
│           -> organizationMembership created (role: member)      │
│           -> user.organizationId set to active org              │
│                                                                  │
│ PalX: Auto-create default organization for user                 │
│       -> organization created (plan: free)                      │
│       -> organizationMembership created (role: owner)           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: PROFILE SETUP                                           │
│ Route: (member)/profile/edit                                    │
│ Fields: name, avatar, bio, preferences                          │
│ Convex mutation: user.update                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: FEATURE DISCOVERY                                       │
│ Route: (member)/dashboard                                       │
│                                                                  │
│ ProX: Course catalog, community spaces, leaderboard             │
│ MediLink: Equipment list, service requests, consumables         │
│ PalX: Chat interface, knowledge base, connections               │
│                                                                  │
│ UI: Role-based navigation shows only accessible features        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Usage Flow

#### ProX Consumer (Student)

| Step | Action                               | Route                                  | Convex Tables Accessed                 |
| ---- | ------------------------------------ | -------------------------------------- | -------------------------------------- |
| 1    | View dashboard with enrolled courses | `(member)/dashboard`                   | `enrollments`, `courses`, `progress`   |
| 2    | Browse course catalog                | `(member)/courses`                     | `courses` (filtered by organizationId) |
| 3    | View course details                  | `(member)/courses/[slug]`              | `courses`, `lessons`                   |
| 4    | Enroll in course                     | `(member)/courses/[slug]` (action)     | `enrollments.create`                   |
| 5    | Access lesson content                | `(member)/courses/[slug]/lessons/[id]` | `lessons`, `progress`                  |
| 6    | Track progress                       | `(member)/courses/[slug]`              | `progress.update`                      |
| 7    | Post in community                    | `(member)/community`                   | `posts.create`, `spaces`               |
| 8    | Comment on posts                     | `(member)/community/[postId]`          | `comments.create`                      |
| 9    | View achievements                    | `(member)/profile`                     | `userAchievements`, `achievements`     |
| 10   | Check leaderboard                    | `(member)/leaderboard`                 | `leaderboardEntries`                   |
| 11   | Join groups                          | `(member)/groups/[id]`                 | `groupMembers.create`                  |
| 12   | Receive notifications                | Header bell icon                       | `notifications` (real-time)            |

#### MediLink Consumer (Hospital Staff)

| Step | Action                               | Route                            | Convex Tables Accessed                                    |
| ---- | ------------------------------------ | -------------------------------- | --------------------------------------------------------- |
| 1    | View dashboard with equipment status | `(member)/dashboard`             | `equipment` (by organizationId)                           |
| 2    | Browse equipment inventory           | `(member)/equipment`             | `equipment`, `equipmentCategory`                          |
| 3    | View equipment details + history     | `(member)/equipment/[id]`        | `equipment`, `equipmentHistory`, `maintenanceRecord`      |
| 4    | Scan QR code on equipment            | `(member)/equipment` (camera)    | `qrCode` -> navigate to equipment detail                  |
| 5    | Submit service request               | `(member)/service-requests/new`  | `serviceRequest.create`                                   |
| 6    | Track service request status         | `(member)/service-requests/[id]` | `serviceRequest`, `serviceQuote`, `serviceRequestHistory` |
| 7    | Compare provider quotes              | `(member)/service-requests/[id]` | `serviceQuote` (multiple per request)                     |
| 8    | Rate completed service               | `(member)/service-requests/[id]` | `serviceRating.create`                                    |
| 9    | View consumable supply levels        | `(member)/consumables`           | `consumable` (by equipmentId)                             |
| 10   | Submit support ticket                | `(member)/support/new`           | `supportTicket.create`                                    |
| 11   | Create dispute                       | `(member)/service-requests/[id]` | `dispute.create`                                          |
| 12   | Chat with AI copilot                 | Floating chat button             | `aiConversation`                                          |
| 13   | Receive notifications                | Header bell icon                 | `notification` (real-time)                                |

#### PalX Consumer (Personal User)

| Step | Action                     | Route                       | Convex Tables Accessed               |
| ---- | -------------------------- | --------------------------- | ------------------------------------ |
| 1    | View dashboard             | `(member)/dashboard`        | `conversations`, `usageTracking`     |
| 2    | Start conversation with AI | `(member)/chat`             | `conversations.create`               |
| 3    | Send message               | `(member)/chat/[id]`        | `messages.create`                    |
| 4    | Browse knowledge base      | `(member)/knowledge`        | `knowledgeBase` (by category)        |
| 5    | Bookmark knowledge         | `(member)/knowledge/[id]`   | `userKnowledge.create`               |
| 6    | View YAML flows            | `(member)/flows`            | `yamlFlows`, `flowTriggers`          |
| 7    | Manage connections         | `(member)/connections`      | `appConnections`, `oauthCredentials` |
| 8    | Track spending             | `(member)/spending`         | `spending`                           |
| 9    | Manage habits              | `(member)/habits`           | `habits`                             |
| 10   | View usage                 | `(member)/settings/billing` | `usageTracking`                      |
| 11   | Check notifications        | Header bell icon            | `notifications` (real-time)          |

### 1.3 Account Management Flow

```
Settings -> (member)/settings
├── Profile          -> name, avatar, bio, preferences
│                       Convex: user.update
├── Organization     -> view current org, switch orgs (if multi-org)
│                       Convex: organization.get, organizationMembership.list
├── Billing          -> subscription status, usage, upgrade
│   ├── ProX:        -> membership tier (FREE, STARTER, PRO, VIP)
│   │                   Convex: subscription, membershipTier
│   ├── MediLink:    -> org plan (free, pro, enterprise)
│   │                   Convex: organization.plan
│   └── PalX:        -> user tier (free, paid, admin)
│                       Convex: user.tier, usageTracking
├── Notifications    -> notification preferences (email, in-app, push)
│                       Convex: user.notificationPreferences
├── Security         -> change password, manage sessions, 2FA
│                       Convex: session.list, session.delete
└── Connections (PalX) -> OAuth integrations
                         Convex: appConnections, oauthCredentials
```

---

## 2. Producer Journey

Producers are users who create and manage content or services: instructors (ProX), hospital admins (MediLink). These users hold the **instructor** role (ProX) or **admin** role (MediLink) within their organization.

### 2.1 Content Creation Flow (ProX Instructor)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: ACCESS ADMIN DASHBOARD                                  │
│ Route: (admin)/dashboard                                        │
│ Middleware: requireRole(["owner", "admin", "instructor"])        │
│ View: Overview of own courses, enrollment metrics                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: CREATE NEW COURSE                                       │
│ Route: (admin)/courses/manage/new                               │
│ Form: title, description, category, thumbnail                   │
│ Convex mutation: courses.create                                 │
│ Fields: {                                                        │
│   organizationId,                                                │
│   title, description, instructorId: currentUser._id,            │
│   isPublished: false, createdAt: Date.now()                     │
│ }                                                                │
│ Status: DRAFT                                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: ADD LESSONS                                             │
│ Route: (admin)/courses/manage/[id]/lessons                      │
│ For each lesson:                                                 │
│   - title, content (rich text editor)                           │
│   - media upload (images, videos, attachments)                  │
│   - set order within course                                     │
│ Convex mutation: lessons.create                                 │
│ Fields: {                                                        │
│   organizationId, courseId, title, content, order                │
│ }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: ORGANIZE CONTENT                                        │
│ - Tag lessons by topic                                          │
│ - Set tier gating (FREE, STARTER, PRO, VIP)                    │
│ - Define prerequisites (lesson A before lesson B)               │
│ - Set permissions (which membership tiers can access)           │
│ Convex mutation: courses.update, lessons.update                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: PREVIEW COURSE                                          │
│ Route: (admin)/courses/manage/[id]/preview                      │
│ Shows course as student would see it                            │
│ Verify: lesson order, media playback, tier gating               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: PUBLISH                                                  │
│ Convex mutation: courses.update({ isPublished: true })          │
│ Course appears in catalog for members                           │
│ Notification sent to subscribed members                         │
│ Analytics tracking begins                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Content Management Flow (ProX Instructor)

| Step | Action                    | Route                                   | Convex Operations                                        |
| ---- | ------------------------- | --------------------------------------- | -------------------------------------------------------- |
| 1    | View my courses           | `(admin)/courses/manage`                | `courses.listByInstructor(organizationId, instructorId)` |
| 2    | View enrollment analytics | `(admin)/courses/manage/[id]/analytics` | `analyticsEvent.query`, `enrollments.countByCourse`      |
| 3    | Edit published course     | `(admin)/courses/manage/[id]/edit`      | `courses.update` (preserves existing enrollments)        |
| 4    | Manage lesson ordering    | `(admin)/courses/manage/[id]/lessons`   | `lessons.reorder` (batch update order field)             |
| 5    | View student progress     | `(admin)/courses/manage/[id]/students`  | `enrollments.listByCourse`, `progress.listByCourse`      |
| 6    | Archive course            | `(admin)/courses/manage/[id]`           | `courses.update({ isPublished: false })`                 |

### 2.3 Equipment Administration Flow (MediLink Admin)

| Step | Action                   | Route                                  | Convex Operations                                           |
| ---- | ------------------------ | -------------------------------------- | ----------------------------------------------------------- |
| 1    | View equipment dashboard | `(admin)/dashboard`                    | `equipment.listByOrganization`, status aggregation          |
| 2    | Add new equipment        | `(admin)/equipment/new`                | `equipment.create({ organizationId, ... })`                 |
| 3    | Edit equipment details   | `(admin)/equipment/[id]/edit`          | `equipment.update`                                          |
| 4    | Manage categories        | `(admin)/equipment/categories`         | `equipmentCategory.create/update/delete`                    |
| 5    | Schedule maintenance     | `(admin)/equipment/[id]/maintenance`   | `maintenanceRecord.create({ equipmentId, scheduledDate })`  |
| 6    | Report equipment failure | `(admin)/equipment/[id]/failure`       | `failureReport.create({ equipmentId, severity })`           |
| 7    | Generate QR codes        | `(admin)/equipment/[id]`               | `qrCode.create({ equipmentId, code })`                      |
| 8    | Manage service requests  | `(admin)/service-requests`             | `serviceRequest.listByOrganization`, status filters         |
| 9    | Assign providers         | `(admin)/service-requests/[id]`        | `serviceRequest.assignProvider(providerId)`                 |
| 10   | Approve/reject quotes    | `(admin)/service-requests/[id]/quotes` | `serviceQuote.approve/reject`                               |
| 11   | Manage providers         | `(admin)/providers`                    | `provider.create/update/updateStatus`                       |
| 12   | View audit trail         | `(admin)/audit-log`                    | `auditLog.list({ organizationId, filters })`                |
| 13   | Build automation recipes | `(admin)/automation/new`               | `automationRecipe.create({ trigger, conditions, actions })` |
| 14   | View analytics           | `(admin)/analytics`                    | Equipment counts, service request volume, provider ratings  |

### 2.4 Service Request Lifecycle (MediLink)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌─────────────┐     ┌───────────┐
│  PENDING  │────>│  QUOTED  │────>│ APPROVED │────>│ IN_PROGRESS │────>│ COMPLETED │
│           │     │          │     │          │     │             │     │           │
│ Consumer  │     │ Provider │     │   Admin  │     │  Provider   │     │ Consumer  │
│ creates   │     │ submits  │     │ approves │     │  executes   │     │ rates     │
│ request   │     │ quote(s) │     │ quote    │     │  service    │     │ service   │
└──────────┘     └──────────┘     └──────────┘     └─────────────┘     └───────────┘
      │                                                                       │
      │                          ┌───────────┐                               │
      └──────────────────────────│ CANCELLED │<──── Admin cancels at any     │
                                 └───────────┘      point before completion   │
                                                                              │
                                 ┌───────────┐     ┌───────────┐              │
                                 │   OPEN    │────>│ RESOLVED  │<─────────────┘
                                 │ (dispute) │     │(or REJECT)│   Consumer disputes
                                 └───────────┘     └───────────┘
```

Tables involved per state transition:

- `serviceRequest` (status field updated)
- `serviceRequestHistory` (audit entry created per transition)
- `serviceQuote` (created when provider quotes)
- `serviceRating` (created when consumer rates)
- `dispute` (created if consumer disputes outcome)
- `notification` (sent to relevant parties at each transition)
- `auditLog` (system-level logging of all mutations)

---

## 3. Admin Journey

Admins are organization-level administrators (role: **owner** or **admin**) and platform-level operators (platformRole: **platform_admin** or **platform_support**).

### 3.1 Organization Administration

```
Organization Admin Dashboard: (admin)/dashboard
├── Org-Wide Metrics
│   ├── ProX: Total enrollments, active students, course completion rate, revenue
│   ├── MediLink: Equipment count by status, open service requests, provider ratings
│   └── PalX: Active users, conversations, knowledge base entries, usage
│
├── Member Management: (admin)/users
│   ├── View all organization members (organizationMembership.listByOrg)
│   ├── Invite new member by email (organizationMembership.invite)
│   ├── Change member role (organizationMembership.updateRole)
│   │   Allowed: owner can set any role, admin can set instructor/member/guest
│   ├── Remove member (organizationMembership.remove)
│   └── View member activity log
│
├── Organization Settings: (admin)/settings
│   ├── Organization name, slug, branding
│   ├── Plan management (free, pro, enterprise)
│   └── Feature toggles (per-org feature flags)
│
├── Content Management (ProX): (admin)/courses/manage
│   ├── View all courses in organization
│   ├── Unpublish inappropriate content
│   └── Manage content categories
│
├── Equipment Management (MediLink): (admin)/equipment
│   ├── Full CRUD on equipment
│   ├── Category management
│   ├── Maintenance scheduling
│   └── QR code generation
│
├── Analytics: (admin)/analytics
│   ├── ProX: Enrollment trends, revenue, engagement metrics
│   ├── MediLink: Equipment utilization, service request metrics, provider performance
│   └── Charts via Recharts (lightweight, real-time via Convex subscriptions)
│
├── Billing (owner only): (admin)/billing
│   ├── Subscription management
│   ├── Usage monitoring
│   └── Invoice history
│
└── Audit Log (MediLink): (admin)/audit-log
    ├── All data-changing actions logged
    ├── Filter by user, action type, entity, date range
    └── Convex table: auditLog (action, userId, entityType, entityId, metadata, timestamp)
```

### 3.2 Platform Administration (Super Admin)

Platform admins are SangLeTech staff members with `platformRole: "platform_admin"` on their user record. They access the platform via the `(super)/` route group with additional security gates.

```
Platform Admin Dashboard: (super)/
│
│ SECURITY GATES:
│ 1. Authenticated (Better Auth session)
│ 2. platformRole === "platform_admin"
│ 3. IP allowlist (PLATFORM_ADMIN_IPS env var)
│ 4. Mandatory MFA (Better Auth MFA plugin)
│ 5. Separate audit log for all platform actions
│
├── Tenant Management: (super)/tenants
│   ├── View all organizations across platform
│   ├── Create new organization
│   ├── Suspend organization (set status: suspended)
│   ├── Delete organization (soft delete with data retention)
│   └── Impersonate organization (debug user issues)
│
├── Cross-Org User Management: (super)/users
│   ├── Search users across all organizations
│   ├── View user details (org memberships, roles, activity)
│   ├── Impersonate user (debug session)
│   └── Reset user credentials
│
├── Platform Billing: (super)/billing
│   ├── Revenue per organization
│   ├── Subscription analytics (MRR, churn, upgrades)
│   └── Invoice management
│
├── Platform Analytics: (super)/analytics
│   ├── Cross-org metrics (total users, total content, total revenue)
│   ├── Growth trends
│   └── System health metrics
│
├── Feature Flags: (super)/feature-flags
│   ├── Enable/disable features per organization
│   ├── A/B testing configuration
│   └── Gradual rollout controls
│
└── Platform Audit Log: (super)/audit-log
    ├── All platform-admin actions logged separately
    ├── Higher retention period than org-level audit
    └── Compliance-ready (SOC 2, HIPAA preparation)
```

### 3.3 Admin Role Comparison by Project

| Capability         | ProX Admin                      | MediLink Admin                         | PalX Admin            |
| ------------------ | ------------------------------- | -------------------------------------- | --------------------- |
| Member management  | Invite students, instructors    | Invite hospital staff                  | Invite team members   |
| Content management | Manage all courses              | Manage equipment, providers            | Manage knowledge base |
| Analytics          | Enrollment, revenue, engagement | Equipment, service requests, providers | Usage, conversations  |
| Billing            | Membership tiers                | Org plan management                    | User tier management  |
| Automation         | Course event triggers           | Equipment/service event triggers       | N/A                   |
| Audit log          | Minimal (future)                | Comprehensive (M2-6)                   | Minimal (future)      |
| Route group        | `(admin)/`                      | `(admin)/`                             | `(admin)/`            |
| Minimum role       | owner, admin, instructor        | owner, admin                           | owner, admin          |

---

# Part 2: Convex Schema Documentation

Complete Convex schemas for all three projects with multi-tenancy support (`organizationId` on all domain tables), production-ready indexes, and TypeScript type definitions.

---

## ProX Schema

**Source**: 59 GitHub issues across milestones M0-M5, 14 feature groups
**Tables**: 28 (4 auth + 2 multi-tenancy + 22 domain)

```typescript
// convex/schema.ts -- ProX (Education SaaS)

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================
  // AUTH TABLES (Better Auth + Convex adapter)
  // Source: M0-3, M1-1, M1-2 (ProX issues #40, #53, #54)
  // ============================================================

  user: defineTable({
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.string(),
    image: v.optional(v.string()),
    bio: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")), // Active org
    platformRole: v.optional(
      v.union(v.literal("platform_admin"), v.literal("platform_support")),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_organization", ["organizationId"]),

  session: defineTable({
    userId: v.id("user"),
    token: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  account: defineTable({
    userId: v.id("user"),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["providerId", "accountId"]),

  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_identifier", ["identifier"]),

  // ============================================================
  // MULTI-TENANCY TABLES
  // Source: ARCHITECTURE_STANDARD Section 6-7, Wave 5.2-5.3
  // ============================================================

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.id("user"),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    settings: v.optional(
      v.object({
        branding: v.optional(
          v.object({
            logoUrl: v.optional(v.string()),
            primaryColor: v.optional(v.string()),
          }),
        ),
        features: v.optional(
          v.object({
            communityEnabled: v.optional(v.boolean()),
            gamificationEnabled: v.optional(v.boolean()),
            salesFunnelEnabled: v.optional(v.boolean()),
          }),
        ),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("instructor"),
      v.literal("member"),
      v.literal("guest"),
    ),
    invitedBy: v.optional(v.id("user")),
    joinedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["organizationId", "userId"]),

  // ============================================================
  // COURSE MANAGEMENT
  // Source: ProX issues #1, #2, #3 (M2) -- Feature: Course Management
  // ============================================================

  courses: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    instructorId: v.id("user"),
    categoryId: v.optional(v.string()),
    requiredTier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("vip"),
    ),
    isPublished: v.boolean(),
    estimatedDuration: v.optional(v.number()), // minutes
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_instructor", ["organizationId", "instructorId"])
    .index("by_slug", ["organizationId", "slug"])
    .index("by_category", ["organizationId", "categoryId"]),

  lessons: defineTable({
    organizationId: v.id("organizations"),
    courseId: v.id("courses"),
    title: v.string(),
    content: v.string(), // Rich text / markdown
    mediaUrl: v.optional(v.string()), // Video/image URL
    mediaType: v.optional(
      v.union(v.literal("video"), v.literal("image"), v.literal("document")),
    ),
    order: v.number(),
    estimatedDuration: v.optional(v.number()), // minutes
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_course", ["organizationId", "courseId"])
    .index("by_course_order", ["courseId", "order"]),

  // ============================================================
  // ENROLLMENT & PROGRESS
  // Source: ProX issues #1, #2 (M2) -- Feature: Course Enrollment
  // ============================================================

  enrollments: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    courseId: v.id("courses"),
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("dropped"),
    ),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["organizationId", "userId"])
    .index("by_course", ["organizationId", "courseId"])
    .index("by_user_course", ["userId", "courseId"]),

  progress: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
    completedAt: v.optional(v.number()),
    progressPercent: v.number(), // 0-100
    lastAccessedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_user_lesson", ["userId", "lessonId"]),

  // ============================================================
  // MEMBERSHIP & BILLING
  // Source: ProX issues #5, #6 (M2) -- Feature: Membership & Billing
  // ============================================================

  membershipTiers: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(), // FREE, STARTER, PRO, VIP
    slug: v.string(),
    price: v.number(), // cents (0 for free)
    interval: v.union(
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("lifetime"),
    ),
    features: v.array(v.string()), // Feature descriptions
    maxCourses: v.optional(v.number()), // null = unlimited
    isActive: v.boolean(),
    order: v.number(), // Display order
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_slug", ["organizationId", "slug"]),

  subscriptions: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    tierId: v.id("membershipTiers"),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["organizationId", "userId"])
    .index("by_stripe", ["stripeSubscriptionId"]),

  // ============================================================
  // COMMUNITY & SOCIAL
  // Source: ProX issues #22, #23, #24 (M3) -- Feature: Community
  // ============================================================

  spaces: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("general"),
      v.literal("course"),
      v.literal("study_group"),
    ),
    isPublic: v.boolean(),
    createdBy: v.id("user"),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_slug", ["organizationId", "slug"]),

  posts: defineTable({
    organizationId: v.id("organizations"),
    spaceId: v.id("spaces"),
    authorId: v.id("user"),
    title: v.optional(v.string()),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    isPinned: v.boolean(),
    reactionCount: v.number(),
    commentCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_space", ["organizationId", "spaceId"])
    .index("by_author", ["organizationId", "authorId"]),

  comments: defineTable({
    organizationId: v.id("organizations"),
    postId: v.id("posts"),
    parentId: v.optional(v.id("comments")), // Nested replies
    authorId: v.id("user"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_post", ["organizationId", "postId"])
    .index("by_parent", ["parentId"]),

  reactions: defineTable({
    organizationId: v.id("organizations"),
    postId: v.id("posts"),
    userId: v.id("user"),
    type: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("fire"),
      v.literal("clap"),
    ),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_post", ["organizationId", "postId"])
    .index("by_user_post", ["userId", "postId"]),

  // ============================================================
  // GROUPS & SPACES
  // Source: ProX issues #26, #28 (M3) -- Feature: Groups
  // ============================================================

  groups: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.string(),
    spaceId: v.optional(v.id("spaces")), // Link to community space
    createdBy: v.id("user"),
    isPublic: v.boolean(),
    maxMembers: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  groupMembers: defineTable({
    organizationId: v.id("organizations"),
    groupId: v.id("groups"),
    userId: v.id("user"),
    role: v.union(v.literal("owner"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_group", ["organizationId", "groupId"])
    .index("by_user", ["organizationId", "userId"]),

  // ============================================================
  // GAMIFICATION
  // Source: ProX issues #30, #31, #32 (M3) -- Feature: Gamification
  // ============================================================

  achievements: defineTable({
    organizationId: v.optional(v.id("organizations")), // null = global
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    type: v.union(
      v.literal("course_completion"),
      v.literal("community_participation"),
      v.literal("streak"),
      v.literal("milestone"),
    ),
    threshold: v.number(), // e.g., complete 5 courses
    points: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_type", ["type"]),

  userAchievements: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    achievementId: v.id("achievements"),
    earnedAt: v.number(),
    progress: v.number(), // 0-100 for in-progress
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["organizationId", "userId"])
    .index("by_achievement", ["achievementId"]),

  leaderboardEntries: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    spaceId: v.optional(v.id("spaces")), // null = org-wide leaderboard
    points: v.number(),
    period: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("alltime"),
    ),
    periodStart: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_period", ["organizationId", "period"])
    .index("by_space", ["organizationId", "spaceId"]),

  // ============================================================
  // LINCHPIN (CORE LEARNING PATH)
  // Source: ProX issues #33, #34 (M3) -- Feature: Linchpin
  // ============================================================

  linchpinLinks: defineTable({
    organizationId: v.optional(v.id("organizations")), // null = user-owned
    userId: v.id("user"),
    title: v.string(),
    url: v.string(),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
    isFavorite: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["organizationId", "userId"]),

  // ============================================================
  // NOTIFICATIONS
  // Source: ProX issues #4, #7 (M4) -- Feature: Notifications
  // ============================================================

  notifications: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    type: v.union(
      v.literal("course_update"),
      v.literal("community_mention"),
      v.literal("achievement_earned"),
      v.literal("enrollment_confirmed"),
      v.literal("system_announcement"),
    ),
    title: v.string(),
    message: v.string(),
    entityType: v.optional(v.string()), // "course", "post", etc.
    entityId: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["organizationId", "userId"])
    .index("by_user_unread", ["userId", "isRead"]),

  // ============================================================
  // ANALYTICS
  // Source: ProX issues #9, #11 (M4) -- Feature: Analytics
  // ============================================================

  analyticsEvents: defineTable({
    organizationId: v.id("organizations"),
    userId: v.optional(v.id("user")),
    eventType: v.string(), // "page_view", "enrollment", "lesson_complete"
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_type", ["organizationId", "eventType"])
    .index("by_date", ["organizationId", "createdAt"]),

  // ============================================================
  // SALES FUNNEL
  // Source: ProX issues #13, #15 (M4) -- Feature: Sales Funnel
  // ============================================================

  salesFunnelStages: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    type: v.union(
      v.literal("landing"),
      v.literal("offer"),
      v.literal("checkout"),
      v.literal("upsell"),
      v.literal("thank_you"),
    ),
    order: v.number(),
    config: v.optional(v.any()), // Stage-specific configuration
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  salesFunnelConversions: defineTable({
    organizationId: v.id("organizations"),
    stageId: v.id("salesFunnelStages"),
    userId: v.optional(v.id("user")),
    visitorId: v.optional(v.string()), // Anonymous tracking
    action: v.union(
      v.literal("view"),
      v.literal("click"),
      v.literal("convert"),
    ),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_stage", ["organizationId", "stageId"]),

  // ============================================================
  // AUTOMATION
  // Source: ProX issues #18, #19 (M4) -- Feature: Automation
  // ============================================================

  automationWorkflows: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    trigger: v.union(
      v.literal("enrollment"),
      v.literal("course_completion"),
      v.literal("membership_change"),
      v.literal("community_post"),
      v.literal("scheduled"),
    ),
    conditions: v.optional(v.any()), // Condition tree
    actions: v.array(
      v.object({
        type: v.union(
          v.literal("send_notification"),
          v.literal("send_email"),
          v.literal("update_field"),
          v.literal("add_to_group"),
        ),
        config: v.any(),
      }),
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_trigger", ["organizationId", "trigger"]),

  automationExecutions: defineTable({
    organizationId: v.id("organizations"),
    workflowId: v.id("automationWorkflows"),
    triggeredBy: v.optional(v.id("user")),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_workflow", ["organizationId", "workflowId"]),

  // ============================================================
  // CONTENT MANAGEMENT
  // Source: ProX issues #10, #12 (M2) -- Feature: Content
  // ============================================================

  resourceContent: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    body: v.string(),
    type: v.union(
      v.literal("article"),
      v.literal("video"),
      v.literal("document"),
      v.literal("resource"),
    ),
    authorId: v.id("user"),
    isPublished: v.boolean(),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_author", ["organizationId", "authorId"]),
});
```

**Table count**: 28 tables (4 auth + 2 multi-tenancy + 22 domain)
**Index count**: 58 indexes

---

## MediLink Schema

**Source**: 45 GitHub issues across milestones M0-M5, 12 feature groups, 15 legacy plugins
**Tables**: 23 (4 auth + 2 multi-tenancy + 17 domain)
**Migration**: Postgres (Drizzle ORM) to Convex

```typescript
// convex/schema.ts -- MediLink (Healthcare Equipment Management)

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================
  // AUTH TABLES (Better Auth + Convex adapter)
  // Source: M0-3 -- Same pattern as ProX
  // ============================================================

  user: defineTable({
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.string(),
    image: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    platformRole: v.optional(
      v.union(v.literal("platform_admin"), v.literal("platform_support")),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_organization", ["organizationId"]),

  session: defineTable({
    userId: v.id("user"),
    token: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  account: defineTable({
    userId: v.id("user"),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["providerId", "accountId"]),

  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_identifier", ["identifier"]),

  // ============================================================
  // MULTI-TENANCY TABLES (Hospitals as organizations)
  // Source: M0-2 -- Each hospital is an organization
  // ============================================================

  organizations: defineTable({
    name: v.string(), // Hospital name
    slug: v.string(),
    ownerId: v.id("user"),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    role: v.union(
      v.literal("owner"), // Clinic owner
      v.literal("admin"), // Clinic admin
      v.literal("instructor"), // Doctor/Provider
      v.literal("member"), // Hospital staff
      v.literal("guest"), // Family member / visitor
    ),
    invitedBy: v.optional(v.id("user")),
    joinedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["organizationId", "userId"]),

  // ============================================================
  // EQUIPMENT DOMAIN
  // Source: M1-1, M1-4, M1-5 (legacy: plugin_equipment_*)
  // Migration: 6 Drizzle tables -> 5 Convex tables
  // ============================================================

  equipment: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    serialNumber: v.optional(v.string()),
    categoryId: v.id("equipmentCategories"),
    status: v.union(
      v.literal("operational"),
      v.literal("maintenance"),
      v.literal("out_of_service"),
      v.literal("decommissioned"),
    ),
    location: v.optional(v.string()),
    department: v.optional(v.string()),
    purchaseDate: v.optional(v.number()),
    warrantyExpiry: v.optional(v.number()),
    specifications: v.optional(v.any()), // Equipment-specific metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_category", ["organizationId", "categoryId"])
    .index("by_status", ["organizationId", "status"])
    .index("by_serial", ["serialNumber"]),

  equipmentCategories: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("equipmentCategories")),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_parent", ["organizationId", "parentId"]),

  equipmentHistory: defineTable({
    organizationId: v.id("organizations"),
    equipmentId: v.id("equipment"),
    action: v.string(), // "status_change", "maintenance", "transfer"
    previousStatus: v.optional(v.string()),
    newStatus: v.optional(v.string()),
    performedBy: v.id("user"),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_equipment", ["organizationId", "equipmentId"]),

  maintenanceRecords: defineTable({
    organizationId: v.id("organizations"),
    equipmentId: v.id("equipment"),
    type: v.union(
      v.literal("preventive"),
      v.literal("corrective"),
      v.literal("calibration"),
      v.literal("inspection"),
    ),
    scheduledDate: v.number(),
    completedDate: v.optional(v.number()),
    performedBy: v.optional(v.id("user")),
    notes: v.optional(v.string()),
    cost: v.optional(v.number()), // cents
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("overdue"),
    ),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_equipment", ["organizationId", "equipmentId"])
    .index("by_status", ["organizationId", "status"])
    .index("by_scheduled_date", ["organizationId", "scheduledDate"]),

  failureReports: defineTable({
    organizationId: v.id("organizations"),
    equipmentId: v.id("equipment"),
    reportedBy: v.id("user"),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    description: v.string(),
    resolution: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_equipment", ["organizationId", "equipmentId"])
    .index("by_severity", ["organizationId", "severity"]),

  // ============================================================
  // SERVICE REQUEST DOMAIN
  // Source: M1-2, M1-6, M1-7 (legacy: plugin_service_requests_*)
  // Status workflow: pending -> quoted -> approved -> in_progress -> completed
  // ============================================================

  serviceRequests: defineTable({
    organizationId: v.id("organizations"),
    equipmentId: v.id("equipment"),
    requestedBy: v.id("user"),
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("quoted"),
      v.literal("approved"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    assignedProviderId: v.optional(v.id("providers")),
    approvedQuoteId: v.optional(v.id("serviceQuotes")),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_equipment", ["organizationId", "equipmentId"])
    .index("by_status", ["organizationId", "status"])
    .index("by_requester", ["organizationId", "requestedBy"])
    .index("by_provider", ["organizationId", "assignedProviderId"]),

  serviceQuotes: defineTable({
    organizationId: v.id("organizations"),
    serviceRequestId: v.id("serviceRequests"),
    providerId: v.id("providers"),
    amount: v.number(), // cents
    currency: v.string(), // "USD", "VND"
    estimatedDays: v.number(),
    description: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_request", ["organizationId", "serviceRequestId"])
    .index("by_provider", ["organizationId", "providerId"]),

  serviceRatings: defineTable({
    organizationId: v.id("organizations"),
    serviceRequestId: v.id("serviceRequests"),
    userId: v.id("user"),
    rating: v.number(), // 1-5
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_request", ["serviceRequestId"]),

  serviceRequestHistory: defineTable({
    organizationId: v.id("organizations"),
    serviceRequestId: v.id("serviceRequests"),
    previousStatus: v.string(),
    newStatus: v.string(),
    changedBy: v.id("user"),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_request", ["organizationId", "serviceRequestId"]),

  // ============================================================
  // PROVIDER MANAGEMENT
  // Source: M1-3 (legacy: plugin_providers)
  // ============================================================

  providers: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    specialty: v.string(),
    serviceAreas: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    ),
    averageRating: v.optional(v.number()),
    totalJobs: v.number(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_specialty", ["organizationId", "specialty"])
    .index("by_status", ["organizationId", "status"]),

  // ============================================================
  // QR CODE
  // Source: M2-1 (legacy: plugin_qr_codes_*)
  // ============================================================

  qrCodes: defineTable({
    organizationId: v.id("organizations"),
    equipmentId: v.id("equipment"),
    code: v.string(), // Unique QR code value
    generatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_equipment", ["equipmentId"])
    .index("by_code", ["code"]),

  // ============================================================
  // CONSUMABLE TRACKING
  // Source: M2-2 (legacy: plugin_consumables)
  // ============================================================

  consumables: defineTable({
    organizationId: v.id("organizations"),
    equipmentId: v.optional(v.id("equipment")),
    name: v.string(),
    quantity: v.number(),
    unit: v.string(), // "pcs", "ml", "kg"
    reorderLevel: v.number(),
    supplier: v.optional(v.string()),
    lastRestockedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_equipment", ["organizationId", "equipmentId"]),

  // ============================================================
  // DISPUTES
  // Source: M2-4 (legacy: plugin_disputes)
  // ============================================================

  disputes: defineTable({
    organizationId: v.id("organizations"),
    serviceRequestId: v.id("serviceRequests"),
    raisedBy: v.id("user"),
    reason: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("under_review"),
      v.literal("resolved"),
      v.literal("rejected"),
    ),
    resolution: v.optional(v.string()),
    resolvedBy: v.optional(v.id("user")),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_request", ["serviceRequestId"])
    .index("by_status", ["organizationId", "status"]),

  // ============================================================
  // SUPPORT TICKETING
  // Source: M2-5 (legacy: plugin_support_tickets)
  // ============================================================

  supportTickets: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assignedTo: v.optional(v.id("user")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["organizationId", "userId"])
    .index("by_status", ["organizationId", "status"]),

  // ============================================================
  // AUDIT LOG
  // Source: M2-6, M4-2 (legacy: plugin_audit_logs)
  // ============================================================

  auditLog: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    action: v.string(), // "create", "update", "delete"
    entityType: v.string(), // "equipment", "serviceRequest", etc.
    entityId: v.string(),
    metadata: v.optional(v.any()), // Before/after state
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["organizationId", "userId"])
    .index("by_entity", ["organizationId", "entityType", "entityId"])
    .index("by_date", ["organizationId", "createdAt"]),

  // ============================================================
  // NOTIFICATIONS
  // Source: M3-3, M3-4 (legacy: plugin_notifications_*)
  // ============================================================

  notifications: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    type: v.union(
      v.literal("equipment_status"),
      v.literal("service_request_update"),
      v.literal("maintenance_due"),
      v.literal("low_stock"),
      v.literal("dispute_update"),
      v.literal("system_announcement"),
    ),
    title: v.string(),
    message: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["organizationId", "userId"])
    .index("by_user_unread", ["userId", "isRead"]),

  notificationTemplates: defineTable({
    organizationId: v.id("organizations"),
    type: v.string(), // Matches notification type
    subject: v.string(),
    bodyTemplate: v.string(), // Template with {{variables}}
    channels: v.array(
      v.union(v.literal("in_app"), v.literal("email"), v.literal("push")),
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_type", ["organizationId", "type"]),

  // ============================================================
  // AUTOMATION
  // Source: M3-1, M3-2 (legacy: plugin_automation_* -- REBUILD)
  // Replaces EventEmitter3 event bus with Convex scheduled functions
  // ============================================================

  automationRecipes: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    trigger: v.union(
      v.literal("equipment_status_changed"),
      v.literal("service_request_created"),
      v.literal("maintenance_due"),
      v.literal("low_stock"),
      v.literal("scheduled"),
    ),
    conditions: v.optional(
      v.object({
        field: v.optional(v.string()),
        operator: v.optional(v.string()),
        value: v.optional(v.any()),
      }),
    ),
    actions: v.array(
      v.object({
        type: v.union(
          v.literal("send_notification"),
          v.literal("update_status"),
          v.literal("create_audit_log"),
          v.literal("send_email"),
        ),
        config: v.any(),
      }),
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_trigger", ["organizationId", "trigger"])
    .index("by_active", ["organizationId", "isActive"]),

  automationExecutions: defineTable({
    organizationId: v.id("organizations"),
    recipeId: v.id("automationRecipes"),
    triggeredBy: v.optional(v.string()), // Entity that triggered
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_recipe", ["organizationId", "recipeId"])
    .index("by_status", ["organizationId", "status"]),

  // ============================================================
  // AI ASSISTANT
  // Source: M3-5, M3-6 (legacy: plugin_ai_assistant_* -- REBUILD)
  // ============================================================

  aiConversations: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        timestamp: v.number(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["organizationId", "userId"]),

  // ============================================================
  // ANALYTICS
  // Source: M2-7 -- Read-only aggregation + optional event tracking
  // ============================================================

  analyticsEvents: defineTable({
    organizationId: v.id("organizations"),
    userId: v.optional(v.id("user")),
    eventType: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_type", ["organizationId", "eventType"])
    .index("by_date", ["organizationId", "createdAt"]),

  // ============================================================
  // PAYMENT (STUB)
  // Source: M2-8 -- Stripe integration deferred to post-migration
  // ============================================================

  payments: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    serviceRequestId: v.optional(v.id("serviceRequests")),
    amount: v.number(), // cents
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    stripePaymentId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["organizationId", "userId"])
    .index("by_service_request", ["serviceRequestId"]),
});
```

**Table count**: 23 tables (4 auth + 2 multi-tenancy + 17 domain)
**Index count**: 62 indexes

---

## PalX Schema

**Source**: 35 restructuring issues (P1-P5) + 10 multi-tenancy issues (P6), 8 feature groups
**Tables**: 21 (4 auth + 2 multi-tenancy + 15 domain)
**Current state**: 17 tables with 0% multi-tenancy -- migration required (P6-01 to P6-10)

```typescript
// convex/schema.ts -- PalX (Personal AI Assistant -- POST multi-tenancy migration)

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================
  // AUTH TABLES (Better Auth -- existing, no changes)
  // ============================================================

  user: defineTable({
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.string(),
    image: v.optional(v.string()),
    bio: v.optional(v.string()),
    tier: v.union(
      // Retained for billing compatibility
      v.literal("free"),
      v.literal("paid"),
      v.literal("admin"),
    ),
    organizationId: v.optional(v.id("organizations")), // NEW (P6-02)
    stripeCustomerId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
    subscriptionEndDate: v.optional(v.number()),
    monthlyTokenLimit: v.optional(v.number()),
    tokensUsed: v.optional(v.number()),
    lastTokenReset: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_organization", ["organizationId"]) // NEW (P6-02)
    .index("by_stripe_customer", ["stripeCustomerId"]),

  session: defineTable({
    userId: v.id("user"),
    token: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  account: defineTable({
    userId: v.id("user"),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    idToken: v.optional(v.string()),
    password: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["providerId", "accountId"]),

  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_identifier", ["identifier"]),

  // ============================================================
  // MULTI-TENANCY TABLES (NEW -- P6-01)
  // ============================================================

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    ownerId: v.id("user"),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  organizationMemberships: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("user"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    invitedAt: v.number(),
    joinedAt: v.optional(v.number()),
  })
    .index("by_org", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["organizationId", "userId"]),

  // ============================================================
  // KNOWLEDGE BASE (Content plugin -> packages/content/)
  // Source: P3-05, P6-03
  // ============================================================

  knowledgeBase: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (null = public)
    frameworkId: v.string(),
    category: v.union(v.literal("warriorx"), v.literal("busos")),
    subcategory: v.string(),
    title: v.string(),
    content: v.string(),
    keyTakeaways: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    embedding: v.optional(v.array(v.float64())), // RAG vector
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_framework_id", ["frameworkId"])
    .index("by_organization", ["organizationId"]) // NEW (P6-03)
    .index("by_tags", ["tags"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["category", "subcategory", "organizationId"],
    }),

  userKnowledge: defineTable({
    userId: v.id("user"),
    knowledgeId: v.id("knowledgeBase"),
    bookmarked: v.boolean(),
    completed: v.boolean(),
    notes: v.optional(v.string()),
    lastAccessedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_knowledge", ["knowledgeId"]),

  // ============================================================
  // YAML FLOWS (Content plugin -> packages/content/)
  // Source: P3-05, P6-03
  // ============================================================

  yamlFlows: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (null = public)
    flowId: v.string(),
    name: v.string(),
    category: v.union(v.literal("warriorx"), v.literal("busos")),
    description: v.string(),
    yamlContent: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_flow_id", ["flowId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_organization", ["organizationId"]), // NEW (P6-03)

  flowTriggers: defineTable({
    flowId: v.id("yamlFlows"),
    triggerType: v.union(
      v.literal("schedule"),
      v.literal("event"),
      v.literal("manual"),
    ),
    config: v.any(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_flow", ["flowId"])
    .index("by_type", ["triggerType"]),

  // ============================================================
  // ROUTER ANALYTICS & CONTENT CURATIONS
  // Source: P6-04
  // ============================================================

  routerAnalytics: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (P6-04)
    userId: v.id("user"),
    route: v.string(),
    category: v.optional(v.string()),
    responseTime: v.optional(v.number()),
    confidence: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"]), // NEW

  contentCurations: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (P6-04)
    contentType: v.union(
      v.literal("article"),
      v.literal("video"),
      v.literal("podcast"),
      v.literal("book"),
    ),
    category: v.union(v.literal("warriorx"), v.literal("busos")),
    title: v.string(),
    url: v.optional(v.string()),
    summary: v.optional(v.string()),
    curatedBy: v.id("user"),
    rating: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_curator", ["curatedBy"])
    .index("by_organization", ["organizationId"]), // NEW

  // ============================================================
  // NOTIFICATIONS (Notifications plugin -> packages/notifications/)
  // Source: P3-04, P6-04
  // ============================================================

  notifications: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (P6-04)
    userId: v.id("user"),
    type: v.union(
      v.literal("system"),
      v.literal("achievement"),
      v.literal("reminder"),
      v.literal("social"),
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    actionUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_organization", ["organizationId"]), // NEW

  // ============================================================
  // USAGE TRACKING (Billing plugin -> packages/billing/)
  // Source: P3-01, P6-05
  // ============================================================

  usageTracking: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (P6-05)
    userId: v.id("user"),
    feature: v.string(),
    tokensUsed: v.number(),
    date: v.string(), // "YYYY-MM-DD"
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["userId", "date"])
    .index("by_organization", ["organizationId"]), // NEW

  // ============================================================
  // CHAT (Conversation plugin -> packages/conversation/)
  // Source: P3-03, P4-04, P4-05, P4-06, P6-05
  // ============================================================

  conversations: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (P6-05)
    userId: v.id("user"),
    title: v.string(),
    category: v.optional(
      v.union(v.literal("warriorx"), v.literal("busos"), v.literal("general")),
    ),
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"]), // NEW

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    metadata: v.optional(v.any()), // Tool calls, citations
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  chatbotState: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (P6-05)
    userId: v.id("user"),
    currentFlowId: v.optional(v.string()),
    flowStep: v.optional(v.number()),
    context: v.optional(v.any()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"]), // NEW

  // ============================================================
  // CONNECTIONS (Connections plugin -> packages/connections/)
  // Source: P3-06, P4-07, P4-08, P6-05
  // ============================================================

  appConnections: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (P6-05)
    userId: v.id("user"),
    provider: v.string(), // "google", "apple", "prox"
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error"),
    ),
    lastSyncAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["userId", "provider"])
    .index("by_organization", ["organizationId"]), // NEW

  oauthCredentials: defineTable({
    userId: v.id("user"),
    provider: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["userId", "provider"]),

  // ============================================================
  // SPENDING & HABITS (Connections plugin -> packages/connections/)
  // Premium Dashboard data
  // Source: P6-05
  // ============================================================

  spending: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (P6-05)
    userId: v.id("user"),
    category: v.string(),
    amount: v.number(),
    currency: v.string(),
    date: v.string(), // "YYYY-MM-DD"
    description: v.optional(v.string()),
    source: v.optional(v.string()), // "manual", "google_sheets", etc.
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["userId", "date"])
    .index("by_organization", ["organizationId"]), // NEW

  habits: defineTable({
    organizationId: v.optional(v.id("organizations")), // NEW (P6-05)
    userId: v.id("user"),
    name: v.string(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
    ),
    targetCount: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastCompletedAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"]), // NEW
});
```

**Table count**: 21 tables (4 auth + 2 multi-tenancy + 15 domain)
**Index count**: 46 indexes
**Multi-tenancy migration**: 10 tables require direct `organizationId` addition (P6-01 through P6-07)

---

# Part 3: Cross-Functional Requirements

System-wide concerns that span all three projects.

---

## Authentication (Better Auth)

### Better Auth Integration Pattern

All three projects use Better Auth with the Convex adapter, following the pattern validated in PalX production.

```
┌─────────────────────────────────────────────────────────────────┐
│ AUTHENTICATION FLOW                                             │
│                                                                  │
│ 1. User submits credentials (email/password, OAuth, magic link) │
│ 2. Better Auth validates credentials                            │
│ 3. Better Auth creates/updates records in Convex:               │
│    - user table (email, name, image)                            │
│    - session table (token, expiresAt)                           │
│    - account table (OAuth provider details)                     │
│ 4. Session cookie set in browser                                │
│ 5. Subsequent requests include session cookie                   │
│ 6. Middleware validates session on every request                 │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Auth Flow

```
┌──────────┐     ┌─────────────┐     ┌───────────────────┐
│  Login   │────>│  Session    │────>│  Fetch User's     │
│          │     │  Created    │     │  Organizations     │
│          │     │             │     │  (membership list) │
└──────────┘     └─────────────┘     └────────┬──────────┘
                                               │
                                               v
                                    ┌───────────────────┐
                                    │  Select Active    │
                                    │  Organization     │
                                    │  (or use default) │
                                    └────────┬──────────┘
                                               │
                                               v
                                    ┌───────────────────┐
                                    │  Store orgId in   │
                                    │  client state     │
                                    │  (React context)  │
                                    └────────┬──────────┘
                                               │
                                               v
                                    ┌───────────────────┐
                                    │  ALL queries now   │
                                    │  scoped to         │
                                    │  organizationId    │
                                    └───────────────────┘
```

### Auth Configuration (Better Auth Organization Plugin)

```typescript
// packages/auth/src/index.ts
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: convexAdapter, // Convex adapter (PalX pattern)
  plugins: [
    organization({
      roles: {
        owner: { permissions: ["*"] },
        admin: {
          permissions: [
            "manage:members",
            "manage:content",
            "manage:settings",
            "view:analytics",
            "manage:automation",
          ],
        },
        instructor: {
          permissions: [
            "manage:own_content",
            "view:analytics",
            "manage:community",
          ],
        },
        member: {
          permissions: [
            "read:content",
            "write:community",
            "manage:own_profile",
          ],
        },
        guest: {
          permissions: ["read:content"],
        },
      },
    }),
  ],
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

---

## RBAC (Role-Based Access Control)

### Role Hierarchy (from Wave 5.2)

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

### Permission Matrix

| Permission          | owner | admin | instructor | member | guest |
| ------------------- | ----- | ----- | ---------- | ------ | ----- |
| View content        | Y     | Y     | Y          | Y      | Y     |
| Create content      | Y     | Y     | Y          | -      | -     |
| Edit own content    | Y     | Y     | Y          | -      | -     |
| Edit any content    | Y     | Y     | -          | -      | -     |
| Delete content      | Y     | Y     | -          | -      | -     |
| Manage members      | Y     | Y     | -          | -      | -     |
| Change member roles | Y     | Y     | -          | -      | -     |
| Manage settings     | Y     | Y     | -          | -      | -     |
| View analytics      | Y     | Y     | Y          | -      | -     |
| Manage billing      | Y     | -     | -          | -      | -     |
| Delete organization | Y     | -     | -          | -      | -     |
| Manage automation   | Y     | Y     | -          | -      | -     |
| View audit log      | Y     | Y     | -          | -      | -     |
| Post in community   | Y     | Y     | Y          | Y      | -     |
| Manage own profile  | Y     | Y     | Y          | Y      | Y     |

### RBAC Implementation Pattern (Convex)

```typescript
// convex/lib/rbac.ts

import { ConvexError } from "convex/values";

import { MutationCtx, QueryCtx } from "./_generated/server";

type Role = "owner" | "admin" | "instructor" | "member" | "guest";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 5,
  admin: 4,
  instructor: 3,
  member: 2,
  guest: 1,
};

/**
 * Get current authenticated user or throw
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");

  const user = await ctx.db
    .query("user")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first();

  if (!user) throw new ConvexError("User not found");
  return user;
}

/**
 * Get user's role in a specific organization or throw
 */
export async function requireOrgRole(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  minimumRole: Role,
) {
  const user = await requireAuth(ctx);

  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", user._id),
    )
    .first();

  if (!membership) {
    throw new ConvexError("Not a member of this organization");
  }

  if (ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[minimumRole]) {
    throw new ConvexError(`Requires ${minimumRole} role or higher`);
  }

  return { user, membership };
}

/**
 * Require platform admin role
 */
export async function requirePlatformAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireAuth(ctx);

  if (user.platformRole !== "platform_admin") {
    throw new ConvexError("Platform admin access required");
  }

  return user;
}
```

### RBAC Usage in Mutations

```typescript
// Example: Course creation (ProX)
export const createCourse = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Require instructor role or higher
    const { user } = await requireOrgRole(
      ctx,
      args.organizationId,
      "instructor",
    );

    return await ctx.db.insert("courses", {
      organizationId: args.organizationId,
      title: args.title,
      description: args.description,
      instructorId: user._id,
      slug: slugify(args.title),
      requiredTier: "free",
      isPublished: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

### Route Group Access Control

| Route Group    | Required Auth                     | Middleware Check                        |
| -------------- | --------------------------------- | --------------------------------------- |
| `(auth)/`      | None                              | Public routes                           |
| `(marketing)/` | None                              | Public routes                           |
| `(member)/`    | Session cookie                    | `requireAuth()`                         |
| `(admin)/`     | Session + org role                | `requireOrgRole(orgId, "instructor")`   |
| `(super)/`     | Session + platformRole + IP + MFA | `requirePlatformAdmin()` + IP allowlist |

---

## Multi-Tenancy Patterns

### Data Isolation Principle

**ALL queries MUST filter by organizationId.** This is the single most critical security requirement across all three projects.

### Correct Query Pattern

```typescript
// CORRECT: Always filter by organizationId using index
export const listCourses = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const { user } = await requireOrgRole(ctx, args.organizationId, "member");

    return await ctx.db
      .query("courses")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
  },
});
```

### Incorrect Query Pattern (Security Issue)

```typescript
// INCORRECT: Missing organizationId filter -- exposes all orgs' data
export const listCoursesBad = query({
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect(); // SECURITY ISSUE
  },
});
```

### Public Content Pattern (PalX Knowledge Base)

```typescript
// Content visible to org members OR public (null organizationId)
export const listKnowledge = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    return await ctx.db
      .query("knowledgeBase")
      .filter((q) =>
        q.and(
          q.eq(q.field("category"), args.category),
          q.or(
            q.eq(q.field("organizationId"), user.organizationId),
            q.eq(q.field("organizationId"), undefined), // Public content
          ),
        ),
      )
      .collect();
  },
});
```

### Multi-Tenancy Compliance Status

| Project      | Status                | Coverage         | Migration Required                                      |
| ------------ | --------------------- | ---------------- | ------------------------------------------------------- |
| **ProX**     | COMPLIANT (by design) | 100% planned     | None (pre-implementation)                               |
| **MediLink** | COMPLIANT (by design) | 100% planned     | None (pre-implementation, Postgres to Convex covers it) |
| **PalX**     | NON-COMPLIANT         | 0% (0/17 tables) | Yes: P6-01 through P6-10, 6-8 hours                     |

### PalX Migration Checklist

- [ ] Add `organizations` table (P6-01)
- [ ] Add `organizationMemberships` table (P6-01)
- [ ] Add `organizationId` to `user` table + index (P6-02)
- [ ] Add `organizationId` to 8 content/system tables (P6-03, P6-04)
- [ ] Add `organizationId` to 4 chat/connection tables (P6-05)
- [ ] Update all queries with organizationId filter (P6-06)
- [ ] Run data backfill: create default org, assign all data (P6-07)
- [ ] Build organization UI components (P6-08)
- [ ] Implement RBAC helpers (P6-09)
- [ ] Test data isolation: Org A cannot see Org B data (P6-10)

---

## Error Handling & Notifications

### Error Boundaries (React)

```
Application Error Boundary (root layout)
├── Page-Level Error Boundary
│   ├── auth-error.tsx       -> Redirect to sign-in
│   ├── not-found.tsx        -> 404 page
│   └── error.tsx            -> Generic error with retry
│
├── Feature-Level Error Boundary
│   ├── CourseErrorBoundary   -> "Could not load course" + retry
│   ├── EquipmentErrorBoundary -> "Equipment data unavailable" + retry
│   └── ChatErrorBoundary     -> "Chat service unavailable" + retry
│
└── Component-Level Error Boundary
    ├── Convex query error    -> Loading skeleton + retry
    └── Mutation error        -> Toast notification with error message
```

### API Error Patterns

| HTTP Code | Convex Equivalent                       | Cause             | User-Facing Message                          |
| --------- | --------------------------------------- | ----------------- | -------------------------------------------- |
| 400       | ConvexError("Invalid input")            | Validation failed | "Please check your input and try again"      |
| 401       | ConvexError("Not authenticated")        | No session        | Redirect to sign-in                          |
| 403       | ConvexError("Insufficient permissions") | Wrong role        | "You don't have permission to do this"       |
| 404       | ConvexError("Not found")                | Entity missing    | "This item was not found"                    |
| 429       | ConvexError("Rate limited")             | Too many requests | "Please slow down and try again"             |
| 500       | Unhandled error                         | Server error      | "Something went wrong. We've been notified." |

### User Notification System

| Channel                        | Implementation                                         | Projects        |
| ------------------------------ | ------------------------------------------------------ | --------------- |
| **Toast notifications**        | shadcn/ui Sonner (success, error, info, warning)       | All             |
| **In-app notification center** | Convex real-time subscription on `notifications` table | ProX, MediLink  |
| **Email notifications**        | React Email templates via Convex actions               | MediLink (M3-3) |
| **Push notifications**         | Expo push (PalX mobile)                                | PalX            |
| **Bell icon badge**            | Real-time unread count via Convex subscription         | ProX, MediLink  |

### Notification Types by Project

**ProX:**

- `course_update` -- New lesson, course published
- `community_mention` -- Mentioned in post/comment
- `achievement_earned` -- Badge unlocked
- `enrollment_confirmed` -- Course enrollment confirmed
- `system_announcement` -- Platform-wide announcements

**MediLink:**

- `equipment_status` -- Status change (operational, maintenance, out of service)
- `service_request_update` -- Status transition (pending, quoted, approved, etc.)
- `maintenance_due` -- Upcoming scheduled maintenance
- `low_stock` -- Consumable below reorder level
- `dispute_update` -- Dispute status change

**PalX:**

- `system` -- System updates, maintenance windows
- `achievement` -- WarriorX/BusOS milestone completed
- `reminder` -- Scheduled flow triggers
- `social` -- Connection sync completed

---

## Testing Strategy

### Test Pyramid

```
         /\
        /  \     E2E Tests (Playwright)
       / 20+ \   - User journeys (consumer, producer, admin)
      /--------\  - Organization creation and switching
     /   30+    \ - Role-based UI rendering
    /  Integration\
   /   Tests       \  - Multi-tenancy data isolation
  /     (Vitest)    \ - RBAC permission checks
 /-------------------\ - Authentication flows
/    100+ Unit Tests   \
/ (Vitest + convex-test) \  - Convex functions (queries, mutations)
/-------------------------\ - RBAC helpers
                            - Utility functions
```

### Test Coverage Targets

| Category                                | ProX  | MediLink | PalX  |
| --------------------------------------- | ----- | -------- | ----- |
| Unit tests (Convex functions)           | 100+  | 80+      | 50+   |
| Integration tests (multi-tenancy, RBAC) | 30+   | 40+      | 20+   |
| E2E tests (Playwright)                  | 30-40 | 20-30    | 10-15 |
| VRT screenshots                         | 50-80 | 30-50    | 10-20 |

### Critical Test Scenarios

**Multi-Tenancy Data Isolation (all projects):**

```typescript
test("user in Org A cannot see Org B courses", async () => {
  // Create two organizations
  const orgA = await createOrg("Org A");
  const orgB = await createOrg("Org B");

  // Create course in Org B
  const course = await createCourse(orgB, "Secret Course");

  // Query as Org A user
  const courses = await listCourses(orgA);

  // Org A should NOT see Org B's course
  expect(courses).not.toContainEqual(
    expect.objectContaining({ _id: course._id }),
  );
});
```

**RBAC Permission Check:**

```typescript
test("member cannot create course", async () => {
  const org = await createOrg("Test Org");
  const member = await createUser("member@test.com", org, "member");

  await expect(createCourse(org, "New Course", { as: member })).rejects.toThrow(
    "Requires instructor role or higher",
  );
});
```

**Authentication Flow (E2E):**

```typescript
test("sign up -> verify email -> access dashboard", async ({ page }) => {
  await page.goto("/sign-up");
  await page.fill("[name=email]", "new@test.com");
  await page.fill("[name=password]", "secure-password");
  await page.click("button[type=submit]");

  // Verify redirect to email verification
  await expect(page).toHaveURL("/verify-email");

  // Simulate email verification
  await verifyEmail("new@test.com");

  // Access dashboard
  await page.goto("/dashboard");
  await expect(page.locator("h1")).toContainText("Dashboard");
});
```

---

# Part 4: Integration Points Between Projects

## Shared Infrastructure

### Common Tables (Identical Schema Across All 3 Projects)

| Table                 | Fields                                           | Purpose                   |
| --------------------- | ------------------------------------------------ | ------------------------- |
| `user`                | email, name, image, organizationId, platformRole | User identity             |
| `session`             | userId, token, expiresAt                         | Session management        |
| `account`             | userId, providerId, accountId                    | OAuth accounts            |
| `verification`        | identifier, value, expiresAt                     | Email verification tokens |
| `organizations`       | name, slug, ownerId, plan                        | Multi-tenancy entity      |
| `organizationMembers` | organizationId, userId, role                     | Role assignment           |

These 6 tables have identical structure across ProX, MediLink, and PalX, enabling future extraction into a shared `@sangletech/auth` package.

### Shared Packages (Future Extraction)

| Package                     | Source                              | Shared By      | Purpose                             |
| --------------------------- | ----------------------------------- | -------------- | ----------------------------------- |
| `@sangletech/auth`          | Better Auth config + Convex adapter | All 3          | Authentication + session management |
| `@sangletech/rbac`          | RBAC helpers (requireOrgRole, etc.) | All 3          | Role-based access control           |
| `@sangletech/ui`            | shadcn/ui components                | All 3 (web)    | Design system                       |
| `@sangletech/design-tokens` | Tailwind theme (colors, spacing)    | All 3          | Consistent branding                 |
| `@sangletech/validators`    | Zod schemas for shared types        | All 3          | Input validation                    |
| `@sangletech/analytics`     | Event tracking helpers              | ProX, MediLink | Analytics integration               |

### Shared Middleware Pattern

```typescript
// middleware.ts (same pattern for all 3 projects)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PLATFORM_ADMIN_IPS = process.env.PLATFORM_ADMIN_IPS?.split(",") ?? [];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSession(request);

  // Public routes (auth, marketing)
  if (isPublicRoute(pathname)) return NextResponse.next();

  // No session -> redirect to sign-in
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Platform admin routes -> additional security
  if (pathname.startsWith("/platform")) {
    if (session.user.platformRole !== "platform_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    const clientIp = request.headers.get("x-forwarded-for");
    if (
      PLATFORM_ADMIN_IPS.length > 0 &&
      !PLATFORM_ADMIN_IPS.includes(clientIp ?? "")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Org admin routes -> role check
  if (pathname.startsWith("/admin")) {
    const orgRole = session.user.role;
    if (!["owner", "admin", "instructor"].includes(orgRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Member routes -> any authenticated user
  return NextResponse.next();
}
```

## Data Relationships

### Cross-Org Isolation

```
Organization A (ProX School)          Organization B (ProX School)
┌──────────────────────────┐          ┌──────────────────────────┐
│ Users: Alice, Bob        │          │ Users: Charlie, Dave     │
│ Courses: Math 101        │          │ Courses: Science 201     │
│ Community: Study Group   │          │ Community: Lab Group     │
│ Enrollments: Alice->Math │          │ Enrollments: Charlie->Sci│
│                          │          │                          │
│   ALL data isolated by   │          │   ALL data isolated by   │
│   organizationId         │          │   organizationId         │
└──────────────────────────┘          └──────────────────────────┘

 Alice CANNOT see Science 201
 Charlie CANNOT see Math 101
 Cross-org queries return empty results
```

### User Multi-Org Membership

```
User: alice@example.com
├── Organization A (ProX School Alpha)
│   └── Role: instructor
│       └── Can: create courses, manage content
│
├── Organization B (ProX School Beta)
│   └── Role: member
│       └── Can: browse courses, join community
│
└── Active Organization: A (stored in user.organizationId)
    └── Org switcher UI lets Alice change active org
```

### Super Admin Cross-Org Access

```
User: admin@sangletech.com (platformRole: platform_admin)
├── Can view ALL organizations (ProX, MediLink, PalX)
├── Can impersonate any user for debugging
├── Can manage feature flags per organization
├── Can view platform-wide analytics
├── Access gated by: IP allowlist + MFA + audit logging
└── Route: (super)/ route group
```

## API Patterns

### Consistent Across All Projects

| Pattern           | Technology                           | Description                          |
| ----------------- | ------------------------------------ | ------------------------------------ |
| Real-time data    | Convex queries + subscriptions       | Automatic re-renders on data change  |
| Non-reactive APIs | tRPC routers                         | File uploads, external service calls |
| Type safety       | Convex validators + Zod              | End-to-end TypeScript types          |
| Error handling    | ConvexError with typed codes         | Consistent error responses           |
| Input validation  | Convex `v.*` validators              | Schema-level validation in mutations |
| Auth context      | `requireAuth()` + `requireOrgRole()` | Standardized auth helpers            |
| Audit logging     | Convex mutation middleware           | All data-changing actions logged     |
| Rate limiting     | Middleware + Convex rate limiter     | Prevent abuse                        |

### Shared TypeScript Types

```typescript
// packages/validators/src/shared.ts (future shared package)

import { z } from "zod";

export const roleSchema = z.enum([
  "owner",
  "admin",
  "instructor",
  "member",
  "guest",
]);

export const platformRoleSchema = z.enum([
  "platform_admin",
  "platform_support",
]);

export const planSchema = z.enum(["free", "pro", "enterprise"]);

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
});

export type Role = z.infer<typeof roleSchema>;
export type PlatformRole = z.infer<typeof platformRoleSchema>;
export type Plan = z.infer<typeof planSchema>;
```

---

## Appendix: Schema Summary

### Table Counts

| Project           | Auth | Multi-Tenancy | Domain | Total  |
| ----------------- | ---- | ------------- | ------ | ------ |
| ProX              | 4    | 2             | 22     | 28     |
| MediLink          | 4    | 2             | 17     | 23     |
| PalX              | 4    | 2             | 15     | 21     |
| **Unique tables** | 4    | 2             | 54     | **72** |

### Index Counts

| Project  | Total Indexes | organizationId Indexes |
| -------- | ------------- | ---------------------- |
| ProX     | 58            | 22                     |
| MediLink | 62            | 21                     |
| PalX     | 46            | 14                     |

### Cross-Reference to GitHub Issues

| Project   | Total Issues | Feature Groups    | Schema Issues | This Document Covers |
| --------- | ------------ | ----------------- | ------------- | -------------------- |
| ProX      | 59           | 14                | 28 tables     | 100%                 |
| MediLink  | 45           | 12                | 23 tables     | 100%                 |
| PalX      | 44           | 8 + multi-tenancy | 21 tables     | 100%                 |
| **Total** | **148**      | **34**            | **72 tables** | **100%**             |

---

## Source Documents

| Document                     | Path                                                  | Wave |
| ---------------------------- | ----------------------------------------------------- | ---- |
| Feature Specifications       | `plans/feature-specifications.md`                     | 5    |
| User Role Architecture       | `research/user-role-architecture-decision.md`         | 5.2  |
| Multi-Tenancy Validation     | `research/multi-tenancy-schema-validation.md`         | 5.3  |
| PalX Multi-Tenancy Plan      | `plans/palx-multi-tenancy-implementation.md`          | 6.3  |
| MediLink Migration Roadmap   | `plans/medilink-migration-roadmap.md`                 | 3    |
| PalX Architecture Audit      | `research/palx-full-architecture-audit.md`            | 0.3  |
| Architecture Standard Update | `updates/architecture-standard-update.md`             | 6.1  |
| GitHub Issues Update Report  | `updates/github-issues-update-report.md`              | 6.2  |
| ARCHITECTURE_STANDARD.md     | `prox/architecture-decision/ARCHITECTURE_STANDARD.md` | --   |

---

_Generated: 2026-02-16 | Wave 6 - Standards & Issue Updates | Task 6.4_
