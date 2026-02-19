# MediLink Migration Roadmap: T3 Turbo + Convex

## Execution Progress

### Completed Steps

- [x] Plugin architecture audit completed (15 plugins, 35+ tables, complexity 3,365)
- [x] Classification complete: 8 MIGRATE, 4 REBUILD, 3 DISCARD
- [x] Migration roadmap created (M0-M5, 48 issues)

### Next Steps

- [ ] M0-1: Scaffold medilink-convex from create-t3-turbo
- [ ] M0-2: Configure Convex with core schema (users, organizations, roles)
- [ ] M0-3: Configure Better Auth (replace current auth)
- [ ] Continue through M0-M5...

---

## 1. Migration Overview

### Project Goals

MediLink is migrating from a **15-plugin dual-app architecture** (Next.js 15 + tRPC + Drizzle ORM + Postgres) to a **T3 Turbo monolith** (Next.js + Convex + Better Auth). The current architecture's complexity score of 3,365 (11x over the AI capability threshold of 300) makes it unnecessarily complex for its scope (SPMET school medical equipment tracking). The new architecture targets a score of 400-500 (85-88% reduction).

### One-Person-Army Principle

This migration is executed by a **single developer using multiple AI agents in parallel**. Every decision in this document optimizes for:

1. **Agent independence** -- issues must be self-contained enough for an agent to complete without human intervention
2. **Parallel execution** -- multiple agents work on different issues simultaneously via git worktrees
3. **CI as quality gate** -- no human code review; the 6-stage pipeline IS the reviewer
4. **Reference-driven development** -- agents read legacy code and ProX/PalX patterns to inform implementation

### Key Decisions

| Decision         | Choice                                            | Rationale                                                                                |
| ---------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Architecture** | T3 Turbo monolith                                 | 9 packages vs 15 plugins + 2 apps. Complexity 400-500 vs 3,365                           |
| **Database**     | Convex                                            | ProX/PalX validate it. Real-time built-in. TypeScript-native schema. No Drizzle ceremony |
| **Auth**         | Better Auth + Convex adapter                      | Replaces current auth + custom RBAC. PalX pattern proven                                 |
| **UI**           | shadcn/ui + Tailwind CSS 4                        | Already used in legacy MediLink `@repo/ui`. Carry forward                                |
| **API**          | Convex functions (reactive) + tRPC (non-reactive) | Convex replaces tRPC routers for all reactive data                                       |
| **CI/CD**        | Woodpecker CI, 6-stage pipeline                   | Self-hosted. Same as ProX. Zero recurring cost                                           |
| **Monorepo**     | Turborepo + pnpm workspaces                       | Version catalogs. Remote caching on homelab                                              |
| **Deployment**   | Vercel (web) + Convex Cloud                       | Preview deploys on every PR                                                              |
| **Apps**         | Single Next.js app with route groups              | Replaces 2 separate apps (consumer + admin)                                              |

### Total Scope

15 production plugins from legacy MediLink are consolidated into feature modules within a single Next.js app. Plugin infrastructure (plugin loader, manifests, dual-app architecture, event bus) is eliminated entirely.

| Legacy Plugins                               | Migration Decision                                                                               | Count |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----- |
| **MIGRATE** (data models + business logic)   | equipment, service-requests, qr-code, providers, consumables, consumer-mgmt, disputes, audit-log | 8     |
| **REBUILD** (incompatible with new stack)    | automation, notifications, rbac, ai-assistant                                                    | 4     |
| **DISCARD** (plugin infrastructure overhead) | plugins package, plugin.manifest.json, dual-app split                                            | 3     |

---

## 2. Repository Strategy

### 2.1 Legacy Repository: `legacy-medilink`

The current `project-medilink` repository is renamed to `legacy-medilink` and treated as a **READ-ONLY reference**. It is never modified, never deployed, and never has dependencies installed. It exists solely for AI agents to read during migration.

```bash
# Step 1: Rename on GitHub
gh repo rename legacy-medilink --repo Sang-Le-Tech/project-medilink

# Step 2: Update local clone
git remote set-url origin git@github.com:Sang-Le-Tech/legacy-medilink.git
```

```
legacy-medilink/                       # READ-ONLY reference
├── packages/plugins/
│   ├── equipment/
│   │   ├── backend/
│   │   │   ├── schema.ts            # Drizzle schema -> reference for Convex schema
│   │   │   ├── router.ts            # tRPC routes -> reference for Convex functions
│   │   │   └── services/            # Business logic -> port to TypeScript
│   │   ├── consumer/                # Consumer app components -> design reference
│   │   ├── admin/                   # Admin app components -> design reference
│   │   └── tests/                   # Test patterns -> adapt for Vitest + Playwright
│   ├── service-requests/            # Same structure
│   ├── automation/                  # Same structure
│   ├── notifications/               # Same structure
│   ├── rbac/                        # Same structure
│   ├── qr-code/                     # Same structure
│   ├── providers/                   # Same structure
│   ├── consumables/                 # Same structure
│   ├── ai-assistant/                # Same structure
│   ├── consumer-mgmt/               # Same structure
│   ├── analytics/                   # Same structure
│   ├── disputes/                    # Same structure
│   ├── payment/                     # Same structure
│   ├── support/                     # Same structure
│   └── audit-log/                   # Same structure
├── apps/
│   ├── consumer/                    # Consumer web app reference
│   └── admin/                       # Admin web app reference
├── packages/
│   ├── db/                          # Drizzle schema (core tables)
│   ├── ui/                          # Shared UI components
│   ├── api/                         # tRPC root router
│   └── plugins/src/                 # Plugin loader + registry (DISCARD)
└── plugin.manifest.json             # Plugin manifests (DISCARD)
```

**How AI agents reference legacy code:**

When an issue says "Reference: `legacy-medilink/packages/plugins/equipment/`", the agent:

1. Reads `backend/schema.ts` to understand data shape (port to Convex tables)
2. Reads `backend/router.ts` to understand API contracts (port to Convex functions)
3. Reads `backend/services/` to understand business logic (port to TypeScript)
4. Reads `consumer/` and `admin/` for UI patterns (rebuild with shadcn/ui in route groups)
5. Does NOT attempt to run, install, or import from legacy code

### 2.2 New Repository: `medilink-convex`

The new T3 Turbo monorepo is created from `create-t3-turbo` template, then customized using PalX patterns for Convex + Better Auth integration.

```
medilink-convex/                       # ACTIVE development
├── apps/
│   └── web/                          # Next.js App Router (SINGLE app)
│       └── src/
│           ├── app/                  # Routes
│           │   ├── (auth)/           # sign-in, sign-up, forgot-password
│           │   ├── (consumer)/       # Hospital user routes
│           │   │   ├── dashboard/
│           │   │   ├── equipment/
│           │   │   ├── service-requests/
│           │   │   ├── consumables/
│           │   │   └── support/
│           │   ├── (admin)/          # Admin routes
│           │   │   ├── dashboard/
│           │   │   ├── equipment/manage/
│           │   │   ├── providers/
│           │   │   ├── analytics/
│           │   │   ├── users/
│           │   │   └── settings/
│           │   ├── api/              # API routes
│           │   │   ├── trpc/[trpc]/  # tRPC handler
│           │   │   └── auth/         # Auth endpoints
│           │   ├── layout.tsx        # Root layout (providers)
│           │   └── page.tsx          # Landing page
│           ├── features/             # Feature modules (colocated)
│           │   ├── equipment/
│           │   │   ├── components/   # EquipmentCard, EquipmentTable, MaintenanceForm
│           │   │   ├── hooks/        # useEquipment, useMaintenanceSchedule
│           │   │   ├── actions/      # Server actions
│           │   │   ├── types.ts
│           │   │   └── index.ts      # Barrel export
│           │   ├── service-requests/
│           │   ├── providers/
│           │   ├── consumables/
│           │   ├── qr-code/
│           │   ├── notifications/
│           │   ├── analytics/
│           │   ├── disputes/
│           │   ├── ai-assistant/
│           │   ├── consumer-mgmt/
│           │   ├── support/
│           │   └── audit-log/
│           ├── components/           # Shared app components
│           │   ├── layout/           # Header, Sidebar, Footer, MobileNav
│           │   ├── common/           # ErrorBoundary, LoadingSkeleton
│           │   └── providers/        # ConvexProvider, AuthProvider, ThemeProvider
│           ├── hooks/                # Shared hooks
│           ├── lib/                  # Utilities (cn, formatDate, constants)
│           ├── trpc/                 # tRPC client setup
│           └── env.ts               # @t3-oss/env-nextjs validation
├── packages/
│   ├── api/                          # @medilink/api - tRPC routers (non-reactive)
│   ├── auth/                         # @medilink/auth - Better Auth + Convex adapter
│   ├── db/                           # @medilink/db - Convex schema reference types
│   ├── ui/                           # @medilink/ui - shadcn/ui design system
│   └── validators/                   # @medilink/validators - Zod schemas
├── convex/                           # Convex backend (schema + functions)
│   ├── schema.ts                     # Unified schema (all domains)
│   ├── auth.ts                       # Better Auth adapter functions
│   ├── equipment.ts                  # Equipment queries + mutations
│   ├── serviceRequests.ts            # Service request workflows
│   ├── providers.ts                  # Provider management
│   ├── consumables.ts                # Consumable tracking
│   ├── qrCode.ts                     # QR generation + scanning
│   ├── notifications.ts              # Push + in-app notifications
│   ├── analytics.ts                  # Dashboard aggregations
│   ├── disputes.ts                   # Dispute resolution
│   ├── aiAssistant.ts                # CopilotKit AI actions
│   ├── auditLog.ts                   # Audit trail
│   └── support.ts                    # Support ticketing
├── tooling/
│   ├── eslint/                       # @medilink/eslint-config
│   ├── prettier/                     # @medilink/prettier-config
│   ├── tailwind/                     # @medilink/tailwind-config
│   └── typescript/                   # @medilink/tsconfig
├── e2e/                              # Playwright E2E + VRT tests
├── turbo.json
├── pnpm-workspace.yaml
├── convex.config.ts
└── CLAUDE.md
```

**Package count: 9** (5 core + 4 tooling). Feature organization lives inside `apps/web/src/features/`, not as separate packages.

### 2.3 PalX and ProX as Architecture References

| Reference Pattern                            | Adoption | Source File                           |
| -------------------------------------------- | -------- | ------------------------------------- |
| Convex schema with `defineTable()` + indexes | YES      | `PalX/convex/schema.ts` (461 lines)   |
| Better Auth generic CRUD adapter             | YES      | `PalX/convex/auth.ts` (435 lines)     |
| Convex real-time subscriptions               | YES      | `PalX/convex/conversations.ts`        |
| Feature module pattern (`src/features/`)     | YES      | `ARCHITECTURE_STANDARD.md` Section 2  |
| Single app with route groups                 | YES      | `ARCHITECTURE_STANDARD.md` Section 3  |
| 6-stage CI pipeline                          | YES      | `ARCHITECTURE_STANDARD.md` Section 4  |
| Multi-agent worktree strategy                | YES      | ProX `MIGRATION_ROADMAP.md` Section 7 |

---

## 3. Plugin-to-Feature Mapping

### 3.1 Complete Mapping Table (15 plugins + 3 infrastructure items)

| #   | Legacy Plugin        | Classification | Feature Module Path                   | Convex File                 | Legacy Tables                                                 | Convex Tables                                                                        | Rationale                                                     |
| --- | -------------------- | -------------- | ------------------------------------- | --------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| 1   | equipment            | MIGRATE        | `features/equipment/`                 | `convex/equipment.ts`       | 6 (items, categories, history, maintenance, failures + enums) | 5 (equipment, equipmentCategory, equipmentHistory, maintenanceRecord, failureReport) | Core domain entity, clean schema maps 1:1                     |
| 2   | service-requests     | MIGRATE        | `features/service-requests/`          | `convex/serviceRequests.ts` | 4 (requests, quotes, ratings, history + enums)                | 4 (serviceRequest, serviceQuote, serviceRating, serviceRequestHistory)               | Core workflow, well-isolated domain logic                     |
| 3   | qr-code              | MIGRATE        | `features/qr-code/`                   | `convex/qrCode.ts`          | 1 (qr_codes)                                                  | 1 (qrCode)                                                                           | Isolated utility, lightweight                                 |
| 4   | providers            | MIGRATE        | `features/providers/`                 | `convex/providers.ts`       | 1 (providers)                                                 | 1 (provider)                                                                         | Clean domain entity                                           |
| 5   | consumables          | MIGRATE        | `features/consumables/`               | `convex/consumables.ts`     | 1 (consumables)                                               | 1 (consumable)                                                                       | Domain entity, isolated logic                                 |
| 6   | consumer-mgmt        | MIGRATE        | `features/consumer-mgmt/`             | `convex/consumers.ts`       | 0 (uses core users + organizations)                           | 0 (uses user + organization tables)                                                  | Minimal deps, uses core entities                              |
| 7   | disputes             | MIGRATE        | `features/disputes/`                  | `convex/disputes.ts`        | 1 (disputes)                                                  | 1 (dispute)                                                                          | Isolated workflow                                             |
| 8   | audit-log            | MIGRATE        | `features/audit-log/`                 | `convex/auditLog.ts`        | 1 (audit_logs)                                                | 1 (auditLog)                                                                         | Read-only audit trail                                         |
| 9   | analytics            | MIGRATE        | `features/analytics/`                 | `convex/analytics.ts`       | 0 (read-only aggregation)                                     | 1 (analyticsEvent)                                                                   | Read-only dashboards, may add event tracking table            |
| 10  | support              | MIGRATE        | `features/support/`                   | `convex/support.ts`         | 1 (support_tickets)                                           | 1 (supportTicket)                                                                    | Simple ticketing                                              |
| 11  | payment              | MIGRATE (stub) | `features/payment/`                   | `convex/payment.ts`         | 1 (payments)                                                  | 1 (payment)                                                                          | Stub implementation, integrate Stripe later                   |
| 12  | automation           | REBUILD        | Convex native (crons + actions)       | `convex/automation.ts`      | 2 (recipes, executions + enums)                               | 2 (automationRecipe, automationExecution)                                            | Event bus replaced by Convex scheduled functions + reactivity |
| 13  | notifications        | REBUILD        | `features/notifications/`             | `convex/notifications.ts`   | 2 (notifications + templates)                                 | 2 (notification, notificationTemplate)                                               | Handlebars DB templates replaced by React Email (code-based)  |
| 14  | rbac                 | REBUILD        | Better Auth roles + Convex middleware | `convex/auth.ts` (merged)   | 4 (permissions, role_permissions, user_roles, feature_flags)  | 0 (Better Auth handles roles; feature flags via env vars)                            | Custom RBAC replaced by Better Auth built-in roles            |
| 15  | ai-assistant         | REBUILD        | `features/ai-assistant/`              | `convex/aiAssistant.ts`     | 1 (ai_assistant)                                              | 1 (aiConversation)                                                                   | CopilotKit actions rewritten to use Convex mutations directly |
| --  | plugins package      | DISCARD        | N/A                                   | N/A                         | 0                                                             | 0                                                                                    | Plugin loader eliminated; features are colocated directories  |
| --  | plugin.manifest.json | DISCARD        | N/A                                   | N/A                         | 0                                                             | 0                                                                                    | Routes defined in Next.js App Router, not manifests           |
| --  | Dual app split       | DISCARD        | N/A                                   | N/A                         | 0                                                             | 0                                                                                    | Single app with `(consumer)/` and `(admin)/` route groups     |

### 3.2 Summary

| Classification | Count  | Feature Modules           | Convex Tables                         |
| -------------- | ------ | ------------------------- | ------------------------------------- |
| MIGRATE        | 11     | 11                        | ~12 tables                            |
| REBUILD        | 4      | 3 (rbac merges into auth) | ~5 tables                             |
| DISCARD        | 3      | 0                         | 0                                     |
| **TOTAL**      | **18** | **14 feature modules**    | **~17 domain tables + 4 auth tables** |

---

## 4. Supabase-to-Convex Schema Mapping

### 4.1 Core Tables (from `@repo/db`)

| Drizzle Table (Postgres)   | Convex Table      | Key Changes                                                            |
| -------------------------- | ----------------- | ---------------------------------------------------------------------- |
| `organizations`            | `organization`    | Same fields. `organizationId` FK becomes Convex `v.id("organization")` |
| `users`                    | `user`            | Merge with Better Auth user table. Add `organizationId`, `role` fields |
| `roles`                    | N/A (Better Auth) | Role system handled by Better Auth built-in roles, not custom table    |
| `session` (if exists)      | `session`         | Better Auth session table in Convex                                    |
| `account` (if exists)      | `account`         | Better Auth OAuth accounts in Convex                                   |
| `verification` (if exists) | `verification`    | Better Auth email verification in Convex                               |

### 4.2 Equipment Domain

| Drizzle Table                  | Convex Table        | Schema Changes                                                                                                                                                                           |
| ------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin_equipment_items`       | `equipment`         | `organizationId` FK -> `v.id("organization")`. Enum columns -> `v.union(v.literal(...))`. `jsonb` metadata -> `v.optional(v.any())`. Indexes on `organizationId`, `categoryId`, `status` |
| `plugin_equipment_categories`  | `equipmentCategory` | Simple rename. Add `v.id("organization")` scope                                                                                                                                          |
| `plugin_equipment_history`     | `equipmentHistory`  | `equipmentId` FK -> `v.id("equipment")`. Timestamps -> `v.number()`                                                                                                                      |
| `plugin_equipment_maintenance` | `maintenanceRecord` | Schedule fields preserved. `equipmentId` -> `v.id("equipment")`                                                                                                                          |
| `plugin_equipment_failures`    | `failureReport`     | `equipmentId` -> `v.id("equipment")`. Severity enum -> `v.union(...)`                                                                                                                    |

### 4.3 Service Request Domain

| Drizzle Table                    | Convex Table            | Schema Changes                                                                                                                                                                                        |
| -------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin_service_requests`        | `serviceRequest`        | Status enum -> `v.union(v.literal("pending"), v.literal("quoted"), v.literal("approved"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled"))`. Priority enum -> `v.union(...)` |
| `plugin_service_quotes`          | `serviceQuote`          | `serviceRequestId` -> `v.id("serviceRequest")`. `providerId` -> `v.id("provider")`. Amount in cents                                                                                                   |
| `plugin_service_ratings`         | `serviceRating`         | `serviceRequestId` -> `v.id("serviceRequest")`. Rating 1-5 as `v.number()`                                                                                                                            |
| `plugin_service_request_history` | `serviceRequestHistory` | Status change audit trail. `serviceRequestId` -> `v.id("serviceRequest")`                                                                                                                             |

### 4.4 Automation Domain (REBUILD)

| Drizzle Table                  | Convex Table          | Schema Changes                                                                                                                                                            |
| ------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin_automation_recipes`    | `automationRecipe`    | **Major redesign**: EventEmitter3 triggers become Convex scheduled function triggers. Recipe conditions stored as typed objects, not opaque JSON. `active` flag preserved |
| `plugin_automation_executions` | `automationExecution` | Execution log preserved. `recipeId` -> `v.id("automationRecipe")`. Status enum -> `v.union(...)`                                                                          |

### 4.5 RBAC Domain (REBUILD -> Better Auth)

| Drizzle Table                  | Convex Equivalent       | Migration Strategy                                                                                                                     |
| ------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin_rbac_permissions`      | Better Auth permissions | Built-in Better Auth role + permission system                                                                                          |
| `plugin_rbac_role_permissions` | Better Auth role config | Configured in `packages/auth/` initialization                                                                                          |
| `plugin_rbac_user_roles`       | `user.role` field       | Single role field on user table: `v.union(v.literal("student"), v.literal("instructor"), v.literal("admin"), v.literal("superadmin"))` |
| `plugin_rbac_feature_flags`    | Environment variables   | Feature flags via `NEXT_PUBLIC_FF_*` env vars or Convex config table                                                                   |

### 4.6 Other Domains

| Drizzle Table            | Convex Table                           | Notes                                                           |
| ------------------------ | -------------------------------------- | --------------------------------------------------------------- |
| `plugin_notifications_*` | `notification`, `notificationTemplate` | Templates move from DB (Handlebars) to code (React Email)       |
| `plugin_qr_codes_*`      | `qrCode`                               | Simple table: `equipmentId`, `code`, `createdAt`                |
| `plugin_providers`       | `provider`                             | Provider entity: name, contact, specialty, status               |
| `plugin_consumables`     | `consumable`                           | Consumable tracking: name, quantity, reorderLevel, equipmentId  |
| `plugin_disputes`        | `dispute`                              | `serviceRequestId` -> `v.id("serviceRequest")`. Status workflow |
| `plugin_payments`        | `payment`                              | Stub: amount, status, userId. Stripe integration deferred       |
| `plugin_support_tickets` | `supportTicket`                        | Simple ticketing: title, description, status, priority          |
| `plugin_audit_logs`      | `auditLog`                             | Append-only: action, userId, entityType, entityId, metadata     |
| `plugin_ai_assistant_*`  | `aiConversation`                       | CopilotKit conversations, rewritten for Convex actions          |

### 4.7 Schema Type Mapping Reference

| Drizzle (Postgres)           | Convex                    | Notes                                            |
| ---------------------------- | ------------------------- | ------------------------------------------------ |
| `serial("id")`               | Auto `_id`                | Convex auto-generates IDs                        |
| `text("field")`              | `v.string()`              | Direct map                                       |
| `integer("field")`           | `v.number()`              | JavaScript number (float64)                      |
| `boolean("field")`           | `v.boolean()`             | Direct map                                       |
| `timestamp("field")`         | `v.number()`              | Unix timestamp (ms)                              |
| `jsonb("field")`             | `v.any()` or typed object | Prefer typed: `v.object({...})`                  |
| `enum(...)`                  | `v.union(v.literal(...))` | TypeScript union types                           |
| Foreign key                  | `v.id("tableName")`       | Convex document references                       |
| `nullable()`                 | `v.optional(...)`         | Convex optional fields                           |
| `index(...)`                 | `.index("name", [...])`   | Convex table indexes                             |
| `references(() => table.id)` | `v.id("table")`           | No cascade delete in Convex; handle in mutations |

---

## 5. Milestone Plan

### Milestone 0: Infrastructure Setup

**Dependencies**: None
**Parallel**: NO -- all issues are sequential (scaffold blocks everything)
**Scope**: Repository scaffold, Convex setup, auth, CI, base UI

#### Issues

| ID   | Title                                                         | Type | Effort | Dependencies |
| ---- | ------------------------------------------------------------- | ---- | ------ | ------------ |
| M0-1 | Scaffold medilink-convex from create-t3-turbo                 | NEW  | 3h     | None         |
| M0-2 | Configure Convex with core schema (organization, user)        | NEW  | 2h     | M0-1         |
| M0-3 | Configure Better Auth with Convex adapter                     | NEW  | 5h     | M0-2         |
| M0-4 | Configure Woodpecker CI with 6-stage pipeline                 | NEW  | 3h     | M0-1         |
| M0-5 | Configure Turborepo remote cache and Vercel deployment        | NEW  | 2h     | M0-1         |
| M0-6 | Build base UI layout (consumer + admin route groups, sidebar) | NEW  | 5h     | M0-3         |

### Issue: [M0-1] Scaffold medilink-convex from create-t3-turbo

**User Story**: As a developer, I want a clean T3 Turbo monorepo scaffold, so that I have a working foundation for the MediLink migration.
**Labels**: `milestone:M0`, `priority:critical`, `effort:medium`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-2` -- Canonical folder structure
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m0-1` -- Scaffold steps template
- **PalX turbo.json**: `apps/PalX/turbo.json` -- Turborepo config reference
- **PalX pnpm-workspace**: `apps/PalX/pnpm-workspace.yaml` -- Version catalogs reference

#### Acceptance Criteria

- [ ] `pnpm install` succeeds with no errors
- [ ] `pnpm dev` starts Next.js on localhost:3000
- [ ] `pnpm build` produces clean production build
- [ ] Package scope is `@medilink/*` in all package.json files
- [ ] Convex dev server starts with `npx convex dev`
- [ ] Drizzle/Prisma references removed (Convex replaces DB layer)

---

### Issue: [M0-2] Configure Convex with core schema

**User Story**: As a developer, I want the Convex database configured with core tables, so that feature modules can build on top of a working data layer.
**Labels**: `milestone:M0`, `priority:critical`, `effort:small`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/db/` -- Core Drizzle schema (organizations, users, roles)
- **Plugin Audit**: `research/medilink-plugin-audit.md#database-schema-analysis` -- Table inventory
- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-3` -- Convex database decision
- **PalX Schema**: `apps/PalX/convex/schema.ts` (lines 1-88) -- Auth tables pattern
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#supabase-to-convex` -- Type mapping reference

#### Acceptance Criteria

- [ ] `npx convex dev` runs without errors
- [ ] Schema deploys to Convex Cloud
- [ ] Core tables created: `organization`, `user`, `session`, `account`, `verification`
- [ ] Indexes on `user.by_email`, `user.by_organization`, `session.by_token`
- [ ] `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` env vars configured

---

### Issue: [M0-3] Configure Better Auth with Convex adapter

**User Story**: As a hospital user, I want to sign in securely, so that I can access equipment management features assigned to my organization.
**Labels**: `milestone:M0`, `priority:critical`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/rbac/` -- Current auth/RBAC implementation
- **Plugin Audit**: `research/medilink-plugin-audit.md#rbac` -- RBAC classification and redesign approach
- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-3` -- Better Auth decision
- **PalX Auth Adapter**: `apps/PalX/convex/auth.ts` (435 lines) -- Generic CRUD adapter
- **PalX Auth Package**: `apps/PalX/packages/auth/` -- Better Auth configuration

#### Acceptance Criteria

- [ ] User can sign up with email/password
- [ ] User can sign in and session persists
- [ ] User can sign out and session is destroyed
- [ ] Protected routes redirect to sign-in when unauthenticated
- [ ] Role-based access: `student`, `instructor`, `admin`, `superadmin`
- [ ] Organization-scoped auth (user belongs to organization)

---

### Issue: [M0-4] Configure Woodpecker CI with 6-stage pipeline

**User Story**: As a developer, I want automated CI on every PR, so that code quality is enforced without human review.
**Labels**: `milestone:M0`, `priority:high`, `effort:medium`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-4` -- 6-stage pipeline architecture
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m0-4` -- CI setup steps template
- **ProX CI Strategy**: `prox/architecture-decision/migration-planning/ci-cd-pipeline-strategy.md` -- Pipeline design

#### Acceptance Criteria

- [ ] Woodpecker CI triggers on PR to main
- [ ] All 6 stages defined in `.woodpecker.yml`
- [ ] Turborepo remote cache connected
- [ ] Pipeline completes in under 5 minutes (scaffold)

---

### Issue: [M0-5] Configure Turborepo remote cache and Vercel deployment

**User Story**: As a developer, I want fast builds and preview deployments, so that PRs are validated quickly.
**Labels**: `milestone:M0`, `priority:medium`, `effort:small`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-4` -- CI/CD infrastructure
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m0-5` -- Cache + deploy steps template
- **PalX turbo.json**: `apps/PalX/turbo.json` -- Turborepo config

#### Acceptance Criteria

- [ ] `turbo build` uses remote cache (verify with `>>> FULL TURBO` log)
- [ ] Vercel preview URL generated on every PR
- [ ] Preview deployment connects to Convex dev instance

---

### Issue: [M0-6] Build base UI layout with consumer + admin route groups

**User Story**: As a hospital user, I want a clean navigation layout, so that I can easily access equipment tracking, service requests, and other features.
**Labels**: `milestone:M0`, `priority:high`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/apps/consumer/` -- Consumer app layout reference
- **Legacy Source**: `legacy-medilink/apps/admin/` -- Admin app layout reference
- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-2` -- Route group structure
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m0-6` -- Base UI steps template

#### Acceptance Criteria

- [ ] Route groups: `(auth)/`, `(consumer)/`, `(admin)/`
- [ ] Header with navigation, user avatar dropdown
- [ ] Sidebar for consumer navigation (equipment, service requests, consumables, support)
- [ ] Sidebar for admin navigation (dashboard, equipment, providers, users, analytics)
- [ ] Mobile navigation (Sheet-based)
- [ ] Theme toggle (dark/light)
- [ ] 15+ shadcn/ui components installed

---

**Milestone 0 Exit Criteria**:

- T3 Turbo monorepo running with Convex backend
- Users can sign up, sign in, sign out
- Single app with consumer + admin route groups
- CI pipeline green on scaffold
- Preview deployments working

---

### Milestone 1: Core Domain (Equipment + Service Requests)

**Dependencies**: Milestone 0 complete
**Parallel**: Partially (schema first, then UI in parallel)
**Scope**: Equipment management, service request workflow, provider management, core Convex functions

#### Issues

| ID   | Title                                                                          | Type    | Effort | Dependencies     |
| ---- | ------------------------------------------------------------------------------ | ------- | ------ | ---------------- |
| M1-1 | Equipment: Convex schema + functions (CRUD, categories, history)               | MIGRATE | 6h     | M0-2             |
| M1-2 | Service Requests: Convex schema + functions (workflow, quotes, ratings)        | MIGRATE | 6h     | M0-2             |
| M1-3 | Providers: Convex schema + functions (CRUD, service areas)                     | MIGRATE | 3h     | M0-2             |
| M1-4 | Equipment: Consumer UI (inventory list, detail, history timeline)              | MIGRATE | 8h     | M1-1, M0-6       |
| M1-5 | Equipment: Admin UI (CRUD, category management, maintenance scheduling)        | MIGRATE | 6h     | M1-1, M0-6       |
| M1-6 | Service Requests: Consumer UI (create request, track status, rate service)     | MIGRATE | 8h     | M1-2, M0-6       |
| M1-7 | Service Requests: Admin UI (manage requests, assign providers, approve quotes) | MIGRATE | 6h     | M1-2, M1-3, M0-6 |
| M1-8 | Seed data script (sample equipment, providers, organizations)                  | NEW     | 3h     | M1-1, M1-2, M1-3 |
| M1-9 | E2E tests: equipment CRUD + service request workflow                           | NEW     | 4h     | M1-4, M1-6       |

### Issue: [M1-1] Equipment: Convex schema + functions

**User Story**: As a hospital admin, I want to manage medical equipment inventory, so that I can track equipment status, categories, and maintenance history.
**Labels**: `milestone:M1`, `priority:critical`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/equipment/backend/schema.ts` -- Drizzle schema (6 tables, 7 enums)
- **Legacy Source**: `legacy-medilink/packages/plugins/equipment/backend/router.ts` -- tRPC routes
- **Legacy Source**: `legacy-medilink/packages/plugins/equipment/backend/services/` -- Business logic
- **Plugin Audit**: `research/medilink-plugin-audit.md#equipment` -- Classification and dependency analysis
- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-2` -- Feature module pattern
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#equipment-domain` -- Drizzle-to-Convex mapping

#### Acceptance Criteria

- [ ] Convex tables created: `equipment`, `equipmentCategory`, `equipmentHistory`, `maintenanceRecord`, `failureReport`
- [ ] Queries: `list`, `getById`, `getByCategory`, `getHistory`, `getMaintenanceSchedule`
- [ ] Mutations: `create`, `update`, `updateStatus`, `addHistoryEntry`, `scheduleMaintenace`, `reportFailure`
- [ ] Organization-scoped (all queries filter by `organizationId`)
- [ ] Indexes on `organizationId`, `categoryId`, `status`
- [ ] TypeScript types exported for UI consumption

---

### Issue: [M1-2] Service Requests: Convex schema + functions

**User Story**: As a hospital user, I want to submit service requests for equipment, so that I can get broken equipment repaired by authorized service providers.
**Labels**: `milestone:M1`, `priority:critical`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/service-requests/backend/schema.ts` -- Drizzle schema (4 tables, 4 enums)
- **Legacy Source**: `legacy-medilink/packages/plugins/service-requests/backend/router.ts` -- tRPC routes
- **Legacy Source**: `legacy-medilink/packages/plugins/service-requests/backend/services/` -- Workflow logic
- **Plugin Audit**: `research/medilink-plugin-audit.md#service-requests` -- Classification and dependency analysis
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#service-request-domain` -- Status workflow mapping

#### Acceptance Criteria

- [ ] Convex tables: `serviceRequest`, `serviceQuote`, `serviceRating`, `serviceRequestHistory`
- [ ] Status workflow: pending -> quoted -> approved -> in_progress -> completed
- [ ] Queries: `listByOrganization`, `getById`, `getQuotes`, `getRatings`
- [ ] Mutations: `create`, `updateStatus`, `submitQuote`, `approveQuote`, `rateService`
- [ ] Organization-scoped with role-based access

---

### Issue: [M1-3] Providers: Convex schema + functions

**User Story**: As an admin, I want to manage service providers, so that hospitals can request service from authorized providers.
**Labels**: `milestone:M1`, `priority:high`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/providers/backend/` -- Provider management logic
- **Plugin Audit**: `research/medilink-plugin-audit.md#providers` -- Classification
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#other-domains` -- Provider table mapping

#### Acceptance Criteria

- [ ] Convex table: `provider` (name, contact, specialty, status, organizationId)
- [ ] Queries: `list`, `getById`, `getBySpecialty`
- [ ] Mutations: `create`, `update`, `updateStatus`
- [ ] Linked to service requests via `providerId`

---

### Issue: [M1-4] Equipment: Consumer UI

**User Story**: As a hospital user, I want to browse and view equipment details, so that I can check status, maintenance history, and report issues.
**Labels**: `milestone:M1`, `priority:high`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/equipment/consumer/` -- Consumer app UI components
- **Plugin Audit**: `research/medilink-plugin-audit.md#equipment` -- File count estimates (60-80 files)
- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-2` -- Feature module structure

#### Acceptance Criteria

- [ ] Feature module at `apps/web/src/features/equipment/`
- [ ] Routes: `/equipment` (list), `/equipment/[id]` (detail)
- [ ] Components: EquipmentCard, EquipmentTable, EquipmentDetail, HistoryTimeline, StatusBadge
- [ ] Real-time updates via Convex subscriptions
- [ ] Loading skeletons and error boundaries

---

### Issue: [M1-5] Equipment: Admin UI

**User Story**: As an admin, I want to create, edit, and manage equipment, so that the inventory stays accurate and maintenance is scheduled.
**Labels**: `milestone:M1`, `priority:high`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/equipment/admin/` -- Admin app UI components
- **Plugin Audit**: `research/medilink-plugin-audit.md#equipment` -- Admin file estimates
- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-2` -- Admin route group pattern

#### Acceptance Criteria

- [ ] Routes: `/admin/equipment` (manage), `/admin/equipment/categories`
- [ ] Components: EquipmentForm, CategoryManager, MaintenanceScheduler
- [ ] CRUD operations: create, edit, delete equipment
- [ ] Category management: create, edit categories
- [ ] Maintenance scheduling with calendar view

---

### Issue: [M1-6] Service Requests: Consumer UI

**User Story**: As a hospital user, I want to create service requests and track their status, so that I can get equipment repaired efficiently.
**Labels**: `milestone:M1`, `priority:high`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/service-requests/consumer/` -- Consumer UI components
- **Plugin Audit**: `research/medilink-plugin-audit.md#service-requests` -- File count estimates
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#service-request-domain` -- Status workflow

#### Acceptance Criteria

- [ ] Routes: `/service-requests` (list), `/service-requests/new` (create), `/service-requests/[id]` (detail)
- [ ] Status tracking with visual workflow steps
- [ ] Quote comparison view (when multiple providers quote)
- [ ] Service rating after completion (1-5 stars + comment)

---

### Issue: [M1-7] Service Requests: Admin UI

**User Story**: As an admin, I want to manage service requests and assign providers, so that equipment service is handled efficiently.
**Labels**: `milestone:M1`, `priority:high`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/service-requests/admin/` -- Admin UI components
- **Legacy Source**: `legacy-medilink/packages/plugins/providers/admin/` -- Provider admin UI
- **Plugin Audit**: `research/medilink-plugin-audit.md#service-requests` -- Dependency analysis

#### Acceptance Criteria

- [ ] Routes: `/admin/service-requests` (dashboard), `/admin/providers` (manage)
- [ ] Request queue with filter/sort (status, priority, date)
- [ ] Provider assignment workflow
- [ ] Quote approval/rejection
- [ ] Provider management CRUD

---

### Issue: [M1-8] Seed data script

**User Story**: As a developer, I want sample data loaded, so that I can develop and test features against realistic data.
**Labels**: `milestone:M1`, `priority:medium`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/equipment/backend/schema.ts` -- Equipment data shape
- **Legacy Source**: `legacy-medilink/packages/plugins/service-requests/backend/schema.ts` -- Service request data shape
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m1-6` -- Seed data pattern

#### Acceptance Criteria

- [ ] 2 organizations (Hospital A, Hospital B)
- [ ] 5 users per organization (mix of roles)
- [ ] 20 equipment items (mix of categories and statuses)
- [ ] 5 providers (mix of specialties)
- [ ] 10 service requests (various statuses in workflow)
- [ ] Script runs via `npx convex run seed:all`

---

### Issue: [M1-9] E2E tests: equipment CRUD + service request workflow

**User Story**: As a developer, I want automated E2E tests, so that core workflows are validated on every PR.
**Labels**: `milestone:M1`, `priority:medium`, `effort:medium`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-4` -- E2E testing in 6-stage pipeline
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m1-7` -- E2E test pattern

#### Acceptance Criteria

- [ ] Equipment: view list, view detail, admin create/edit
- [ ] Service requests: create request, track status change, rate service
- [ ] Auth: sign in required for all operations
- [ ] Tests pass in CI (Stage 4)

---

**Milestone 1 Exit Criteria**:

- Equipment inventory management working (consumer + admin)
- Service request workflow functional (create, quote, approve, complete, rate)
- Provider management functional
- Seed data loads for development
- E2E tests pass in CI

---

### Milestone 2: Supporting Features

**Dependencies**: Milestone 1 complete
**Parallel**: YES -- all issues can run simultaneously (independent feature modules)
**Scope**: QR codes, consumables, consumer management, disputes, support, audit log, analytics

#### Issues

| ID    | Title                                                                           | Type    | Effort | Dependencies     |
| ----- | ------------------------------------------------------------------------------- | ------- | ------ | ---------------- |
| M2-1  | QR Code: Convex schema + functions + UI (generate, scan, link to equipment)     | MIGRATE | 5h     | M1-1             |
| M2-2  | Consumables: Convex schema + functions + UI (track, reorder, link to equipment) | MIGRATE | 5h     | M1-1             |
| M2-3  | Consumer Management: Convex functions + Admin UI (hospital user management)     | MIGRATE | 4h     | M0-3, M0-6       |
| M2-4  | Disputes: Convex schema + functions + UI (dispute resolution workflow)          | MIGRATE | 4h     | M1-2             |
| M2-5  | Support: Convex schema + functions + UI (ticketing system)                      | MIGRATE | 4h     | M0-2, M0-6       |
| M2-6  | Audit Log: Convex schema + functions + Admin UI (system audit trail)            | MIGRATE | 3h     | M0-2, M0-6       |
| M2-7  | Analytics: Convex aggregation functions + Admin dashboard UI                    | MIGRATE | 5h     | M1-1, M1-2, M0-6 |
| M2-8  | Payment: Convex schema + stub functions (Stripe integration placeholder)        | MIGRATE | 2h     | M0-2             |
| M2-9  | E2E tests: QR scan, consumables, disputes                                       | NEW     | 3h     | M2-1, M2-2, M2-4 |
| M2-10 | VRT: initial baselines for core pages                                           | NEW     | 3h     | M1-4, M1-6, M0-6 |

### Issue: [M2-1] QR Code: Convex schema + functions + UI

**User Story**: As a hospital user, I want to scan QR codes on equipment, so that I can instantly access equipment details and history.
**Labels**: `milestone:M2`, `priority:high`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/qr-code/` -- QR generation + scanning logic
- **Plugin Audit**: `research/medilink-plugin-audit.md#qr-code` -- Classification (MIGRATE)
- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-2` -- Feature module pattern
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#other-domains` -- QR table mapping

#### Acceptance Criteria

- [ ] Feature module at `apps/web/src/features/qr-code/`
- [ ] Convex table: `qrCode` (equipmentId, code, generatedAt)
- [ ] Generate QR code for any equipment item (admin action)
- [ ] Scan QR code via camera to navigate to equipment detail
- [ ] Printable QR label generation

---

### Issue: [M2-2] Consumables: Convex schema + functions + UI

**User Story**: As a hospital user, I want to track consumable supplies linked to equipment, so that I know when to reorder.
**Labels**: `milestone:M2`, `priority:high`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/consumables/` -- Consumable tracking logic
- **Plugin Audit**: `research/medilink-plugin-audit.md#consumables` -- Classification (MIGRATE)
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#other-domains` -- Consumable table mapping

#### Acceptance Criteria

- [ ] Feature module at `apps/web/src/features/consumables/`
- [ ] Convex table: `consumable` (name, quantity, reorderLevel, equipmentId, organizationId)
- [ ] Consumer: view consumables linked to equipment, see low-stock alerts
- [ ] Admin: CRUD consumables, set reorder levels
- [ ] Low-stock notification trigger (when quantity < reorderLevel)

---

### Issue: [M2-3] Consumer Management: Convex functions + Admin UI

**User Story**: As an admin, I want to manage hospital users within my organization, so that I can control access and monitor usage.
**Labels**: `milestone:M2`, `priority:medium`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/consumer-mgmt/` -- User management logic
- **Plugin Audit**: `research/medilink-plugin-audit.md#consumer-mgmt` -- Classification (MIGRATE, minimal deps)

#### Acceptance Criteria

- [ ] Feature module at `apps/web/src/features/consumer-mgmt/`
- [ ] Admin route: `/admin/users` (list, invite, deactivate)
- [ ] Invite user by email (within organization)
- [ ] Role assignment (student, instructor, admin)
- [ ] User activity overview

---

### Issue: [M2-4] Disputes: Convex schema + functions + UI

**User Story**: As a hospital user, I want to dispute a service request outcome, so that issues with provider service quality are resolved fairly.
**Labels**: `milestone:M2`, `priority:medium`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/disputes/` -- Dispute resolution workflow
- **Plugin Audit**: `research/medilink-plugin-audit.md#disputes` -- Classification (MIGRATE)
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#other-domains` -- Dispute table mapping

#### Acceptance Criteria

- [ ] Feature module at `apps/web/src/features/disputes/`
- [ ] Convex table: `dispute` (serviceRequestId, reason, status, resolution)
- [ ] Consumer: create dispute from completed service request
- [ ] Admin: view disputes, mediate, resolve
- [ ] Status workflow: open -> under_review -> resolved/rejected

---

### Issue: [M2-5] Support: Convex schema + functions + UI

**User Story**: As a hospital user, I want to submit support tickets, so that I can get help with system issues.
**Labels**: `milestone:M2`, `priority:medium`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/support/` -- Support ticketing logic
- **Plugin Audit**: `research/medilink-plugin-audit.md#support` -- Classification (MIGRATE)

#### Acceptance Criteria

- [ ] Feature module at `apps/web/src/features/support/`
- [ ] Convex table: `supportTicket` (title, description, status, priority, userId, organizationId)
- [ ] Consumer: create ticket, view my tickets, add comments
- [ ] Admin: manage all tickets, assign, resolve

---

### Issue: [M2-6] Audit Log: Convex schema + functions + Admin UI

**User Story**: As an admin, I want to view an audit trail of system actions, so that I can track who did what and when.
**Labels**: `milestone:M2`, `priority:medium`, `effort:small`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/audit-log/` -- Audit trail implementation
- **Plugin Audit**: `research/medilink-plugin-audit.md#audit-log` -- Classification (MIGRATE)

#### Acceptance Criteria

- [ ] Feature module at `apps/web/src/features/audit-log/`
- [ ] Convex table: `auditLog` (action, userId, entityType, entityId, metadata, timestamp)
- [ ] Admin route: `/admin/audit-log` (filterable list)
- [ ] Automatic logging from mutations (Convex middleware pattern)

---

### Issue: [M2-7] Analytics: Convex aggregation functions + Admin dashboard

**User Story**: As an admin, I want to see analytics dashboards, so that I can monitor equipment utilization, service request metrics, and system health.
**Labels**: `milestone:M2`, `priority:medium`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/analytics/` -- Dashboard aggregation logic
- **Plugin Audit**: `research/medilink-plugin-audit.md#analytics` -- Classification (MIGRATE with caveat)

#### Acceptance Criteria

- [ ] Feature module at `apps/web/src/features/analytics/`
- [ ] Admin route: `/admin/analytics` (dashboard)
- [ ] Metrics: equipment count by status, service request volume over time, provider ratings
- [ ] Charts using Recharts or similar (lightweight)
- [ ] Real-time updates via Convex subscriptions

---

### Issue: [M2-8] Payment: Convex schema + stub functions

**User Story**: As a developer, I want the payment schema in place, so that Stripe can be integrated when ready.
**Labels**: `milestone:M2`, `priority:low`, `effort:small`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/payment/` -- Stub payment implementation
- **Plugin Audit**: `research/medilink-plugin-audit.md#payment` -- Classification (MIGRATE stub)

#### Acceptance Criteria

- [ ] Convex table: `payment` (amount, currency, status, userId, serviceRequestId)
- [ ] Stub mutations: `createPayment`, `updatePaymentStatus`
- [ ] No Stripe integration yet (deferred to post-migration)

---

### Issue: [M2-9] E2E tests: QR scan, consumables, disputes

**User Story**: As a developer, I want E2E tests for supporting features, so that they are validated on every PR.
**Labels**: `milestone:M2`, `priority:medium`, `effort:medium`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-4` -- E2E testing strategy
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m2-9` -- Testing pattern

#### Acceptance Criteria

- [ ] QR code generation and equipment linking
- [ ] Consumable CRUD and low-stock alert
- [ ] Dispute creation and resolution workflow
- [ ] Tests pass in CI (Stage 4)

---

### Issue: [M2-10] VRT: initial baselines for core pages

**User Story**: As a developer, I want visual regression baselines, so that UI changes are caught automatically.
**Labels**: `milestone:M2`, `priority:medium`, `effort:medium`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-4` -- VRT strategy
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#section-10` -- VRT migration strategy

#### Acceptance Criteria

- [ ] VRT baselines for: dashboard, equipment list, equipment detail, service request list, service request detail
- [ ] Consumer + admin views captured
- [ ] Dark + light mode variants
- [ ] Mobile viewport variants

---

**Milestone 2 Exit Criteria**:

- QR code scanning works end-to-end
- Consumable tracking with reorder alerts
- Consumer management (invite, roles)
- Dispute resolution workflow
- Support ticketing functional
- Audit log capturing mutations
- Analytics dashboard with real metrics
- E2E + VRT coverage for all features

---

### Milestone 3: Rebuild Features (Infrastructure Redesign)

**Dependencies**: Milestone 1 complete
**Parallel**: Partially (automation first, then notifications and AI depend on it)
**Scope**: Automation, notifications, AI assistant -- the 4 REBUILD plugins

#### Issues

| ID   | Title                                                                 | Type    | Effort | Dependencies     |
| ---- | --------------------------------------------------------------------- | ------- | ------ | ---------------- |
| M3-1 | Automation: Convex scheduled functions + crons (replace event bus)    | REBUILD | 8h     | M1-1             |
| M3-2 | Automation: Recipe builder Admin UI (trigger, condition, action)      | REBUILD | 6h     | M3-1, M0-6       |
| M3-3 | Notifications: Convex actions + React Email templates                 | REBUILD | 6h     | M3-1             |
| M3-4 | Notifications: Consumer UI (notification center, preferences)         | REBUILD | 5h     | M3-3, M0-6       |
| M3-5 | AI Assistant: CopilotKit + Convex AI actions (equipment CRUD copilot) | REBUILD | 8h     | M1-1             |
| M3-6 | AI Assistant: Consumer UI (chat interface, action suggestions)        | REBUILD | 6h     | M3-5, M0-6       |
| M3-7 | E2E tests: automation triggers, notification delivery, AI actions     | NEW     | 4h     | M3-2, M3-4, M3-6 |

### Issue: [M3-1] Automation: Convex scheduled functions + crons

**User Story**: As an admin, I want automated workflows triggered by system events, so that repetitive tasks (e.g., maintenance reminders, status escalations) happen automatically.
**Labels**: `milestone:M3`, `priority:critical`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/automation/backend/` -- EventEmitter3 event bus, recipe engine
- **Legacy Source**: `legacy-medilink/packages/plugins/automation/backend/schema.ts` -- Recipe/execution tables
- **Plugin Audit**: `research/medilink-plugin-audit.md#automation` -- REBUILD rationale (9 plugins depend on event bus)
- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-3` -- Convex scheduled functions
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#automation-domain` -- Event bus to Convex migration

#### Acceptance Criteria

- [ ] Convex tables: `automationRecipe`, `automationExecution`
- [ ] Replace EventEmitter3 event bus with Convex scheduled functions
- [ ] Triggers: `equipment_status_changed`, `service_request_created`, `maintenance_due`, `low_stock`
- [ ] Actions: `send_notification`, `update_status`, `create_audit_log`
- [ ] Recipe CRUD: create, update, activate/deactivate, delete
- [ ] Execution logging with status (running, completed, failed)
- [ ] Convex cron for periodic checks (maintenance due, overdue service requests)

---

### Issue: [M3-2] Automation: Recipe builder Admin UI

**User Story**: As an admin, I want to build automation recipes visually, so that I can create workflows without coding.
**Labels**: `milestone:M3`, `priority:high`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/automation/admin/` -- Admin recipe UI
- **Plugin Audit**: `research/medilink-plugin-audit.md#automation` -- UI redesign approach

#### Acceptance Criteria

- [ ] Admin route: `/admin/automation` (recipe list), `/admin/automation/new` (builder)
- [ ] Visual recipe builder: select trigger, add conditions, configure actions
- [ ] Recipe activation/deactivation toggle
- [ ] Execution log viewer (recent runs, success/failure)

---

### Issue: [M3-3] Notifications: Convex actions + React Email templates

**User Story**: As a hospital user, I want to receive notifications for important events, so that I stay informed about equipment status changes and service request updates.
**Labels**: `milestone:M3`, `priority:high`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/notifications/backend/` -- Notification engine, Handlebars templates
- **Plugin Audit**: `research/medilink-plugin-audit.md#notifications` -- REBUILD rationale (Handlebars to React Email)
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#other-domains` -- Notification table mapping

#### Acceptance Criteria

- [ ] Convex tables: `notification`, `notificationTemplate`
- [ ] Replace Handlebars DB templates with React Email (code-based)
- [ ] Notification types: email, in-app
- [ ] Templates: equipment_status, service_request_update, maintenance_due, low_stock
- [ ] Triggered by automation recipes (M3-1 integration)
- [ ] In-app notification creation via Convex mutation

---

### Issue: [M3-4] Notifications: Consumer UI

**User Story**: As a hospital user, I want a notification center, so that I can see and manage my notifications.
**Labels**: `milestone:M3`, `priority:high`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/notifications/consumer/` -- Notification UI
- **ProX Schema**: `MIGRATION_ROADMAP.md#domain-platform-features` -- Notification UI pattern

#### Acceptance Criteria

- [ ] Notification bell icon in header with unread count (real-time via Convex)
- [ ] Notification dropdown (recent 5)
- [ ] Full notification center page: `/notifications`
- [ ] Mark as read (individual + all)
- [ ] Notification preferences (which types to receive)

---

### Issue: [M3-5] AI Assistant: CopilotKit + Convex AI actions

**User Story**: As a hospital user, I want an AI copilot that can help me manage equipment, so that common tasks are faster with natural language commands.
**Labels**: `milestone:M3`, `priority:medium`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/ai-assistant/backend/` -- CopilotKit action definitions
- **Legacy Source**: `legacy-medilink/packages/plugins/ai-assistant/consumer/` -- Chat UI
- **Plugin Audit**: `research/medilink-plugin-audit.md#ai-assistant` -- REBUILD rationale (5 deps, rewrite for Convex)

#### Acceptance Criteria

- [ ] Feature module at `apps/web/src/features/ai-assistant/`
- [ ] CopilotKit actions rewritten to use Convex mutations directly
- [ ] Actions: search equipment, create service request, check maintenance schedule, view analytics summary
- [ ] Convex table: `aiConversation` (userId, messages, createdAt)
- [ ] Conversation history preserved

---

### Issue: [M3-6] AI Assistant: Consumer UI (chat interface)

**User Story**: As a hospital user, I want to chat with the AI assistant from any page, so that I can get help without navigating away.
**Labels**: `milestone:M3`, `priority:medium`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/ai-assistant/consumer/` -- Chat interface components

#### Acceptance Criteria

- [ ] Floating chat button (bottom-right corner)
- [ ] Chat drawer/panel with message history
- [ ] Suggested actions based on current page context
- [ ] Loading indicators for AI responses
- [ ] Accessible via keyboard shortcut (Cmd+K or similar)

---

### Issue: [M3-7] E2E tests: automation, notifications, AI

**User Story**: As a developer, I want E2E tests for rebuild features, so that the redesigned systems work correctly.
**Labels**: `milestone:M3`, `priority:medium`, `effort:medium`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-4` -- E2E testing strategy

#### Acceptance Criteria

- [ ] Automation: create recipe, verify trigger fires, check execution log
- [ ] Notifications: verify in-app notification appears on trigger
- [ ] AI Assistant: send message, verify action executes
- [ ] Tests pass in CI (Stage 4)

---

**Milestone 3 Exit Criteria**:

- Automation recipes replace event bus entirely
- Notifications delivered via React Email + in-app
- AI copilot functional with Convex-backed actions
- All 9 former event bus subscribers work via Convex scheduled functions
- E2E tests for automation + notification + AI pass

---

### Milestone 4: Integration + Data Migration

**Dependencies**: Milestones 1-3 substantially complete
**Parallel**: Partially (testing parallel, data migration sequential)
**Scope**: Cross-feature integration, Postgres-to-Convex data migration, comprehensive testing

#### Issues

| ID   | Title                                                                                | Type | Effort | Dependencies      |
| ---- | ------------------------------------------------------------------------------------ | ---- | ------ | ----------------- |
| M4-1 | Cross-feature integration: notifications triggered by all modules                    | NEW  | 4h     | M3-1, M3-3        |
| M4-2 | Audit log integration: all mutations write audit entries                             | NEW  | 3h     | M2-6, M1-M3       |
| M4-3 | Data migration script: Postgres to Convex (organizations, users, equipment)          | NEW  | 6h     | M1-1 through M3-3 |
| M4-4 | Data migration script: Postgres to Convex (service requests, providers, consumables) | NEW  | 4h     | M4-3              |
| M4-5 | Full E2E test suite (target: 20-30 tests across all features)                        | NEW  | 6h     | M1-M3             |
| M4-6 | VRT coverage (target: 30-50 screenshots)                                             | NEW  | 4h     | M1-M3             |

### Issue: [M4-1] Cross-feature integration: notifications from all modules

**User Story**: As a hospital user, I want to receive notifications from all system events, so that I am informed regardless of which feature triggers the event.
**Labels**: `milestone:M4`, `priority:high`, `effort:medium`

#### Reference Files

- **Plugin Audit**: `research/medilink-plugin-audit.md#dependency-map` -- 9 plugins depend on automation
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#automation-domain` -- Event replacement

#### Acceptance Criteria

- [ ] Equipment status change triggers notification to assigned users
- [ ] Service request status change triggers notification to requester + admin
- [ ] Low stock alert triggers notification to admin
- [ ] Maintenance due triggers notification to equipment manager
- [ ] All notifications appear in notification center (real-time)

---

### Issue: [M4-2] Audit log integration: all mutations log

**User Story**: As an admin, I want every data-changing action logged, so that the audit trail is comprehensive.
**Labels**: `milestone:M4`, `priority:medium`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/audit-log/` -- Current audit implementation
- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-2` -- Feature module pattern

#### Acceptance Criteria

- [ ] Convex middleware/helper that logs mutations automatically
- [ ] All create/update/delete mutations across all features log to `auditLog`
- [ ] Log entries include: userId, action, entityType, entityId, before/after state
- [ ] Admin audit log page shows all entries with filters

---

### Issue: [M4-3] Data migration script: core data (Postgres to Convex)

**User Story**: As a developer, I want to migrate existing production data, so that no data is lost during the transition.
**Labels**: `milestone:M4`, `priority:critical`, `effort:large`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/db/` -- Core Drizzle schema
- **Legacy Source**: `legacy-medilink/packages/plugins/equipment/backend/schema.ts` -- Equipment schema
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#supabase-to-convex` -- Complete type mapping

#### Acceptance Criteria

- [ ] Script reads from Postgres (Drizzle connection)
- [ ] Transforms data to Convex format (type conversions, ID mapping)
- [ ] Imports to Convex via bulk import API
- [ ] Handles: organizations, users, equipment (all 5 tables), providers
- [ ] ID mapping table preserved (old Postgres IDs -> new Convex IDs)
- [ ] Idempotent (safe to re-run)
- [ ] Dry-run mode for validation

---

### Issue: [M4-4] Data migration script: operational data

**User Story**: As a developer, I want all operational data migrated, so that service request history and consumable inventory are preserved.
**Labels**: `milestone:M4`, `priority:critical`, `effort:medium`

#### Reference Files

- **Legacy Source**: `legacy-medilink/packages/plugins/service-requests/backend/schema.ts` -- Service request schema
- **Schema Mapping**: `plans/medilink-migration-roadmap.md#service-request-domain` -- Status mapping

#### Acceptance Criteria

- [ ] Migrate: service requests (all 4 tables), consumables, disputes, support tickets, audit logs
- [ ] Uses ID mapping from M4-3 (reference foreign keys correctly)
- [ ] Status values mapped to Convex union types
- [ ] Timestamp conversions (Postgres timestamp -> Unix ms)
- [ ] Validation report: row counts match source

---

### Issue: [M4-5] Full E2E test suite

**User Story**: As a developer, I want comprehensive E2E coverage, so that the entire application is validated before launch.
**Labels**: `milestone:M4`, `priority:high`, `effort:large`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-4` -- Test targets (20-40 E2E tests)
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m5-1` -- E2E suite pattern

#### Acceptance Criteria

- [ ] 20-30 E2E tests covering all critical user journeys
- [ ] Auth flow (sign up, sign in, sign out, role-based access)
- [ ] Equipment management (full CRUD cycle)
- [ ] Service request workflow (create to completion)
- [ ] Notification delivery verification
- [ ] AI assistant interaction
- [ ] All tests pass in CI (Stage 4)

---

### Issue: [M4-6] VRT coverage

**User Story**: As a developer, I want visual regression coverage, so that UI changes are caught automatically.
**Labels**: `milestone:M4`, `priority:medium`, `effort:medium`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-4` -- VRT targets (50-80 screenshots)
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#section-10` -- VRT strategy

#### Acceptance Criteria

- [ ] 30-50 VRT screenshots with approved baselines
- [ ] Coverage: dashboard, equipment, service requests, consumables, admin views
- [ ] Dark + light mode variants
- [ ] Mobile viewport variants
- [ ] VRT passes in CI (Stage 5)

---

**Milestone 4 Exit Criteria**:

- All features integrated (notifications fire from all modules)
- Audit trail captures all mutations
- Data migration scripts tested and validated
- 20+ E2E tests passing
- 30+ VRT screenshots approved

---

### Milestone 5: Polish and Launch

**Dependencies**: Milestones 1-4 complete
**Parallel**: Partially (audits parallel, deployment sequential)
**Scope**: Performance, security, accessibility, production deployment

#### Issues

| ID   | Title                                                         | Type | Effort | Dependencies      |
| ---- | ------------------------------------------------------------- | ---- | ------ | ----------------- |
| M5-1 | Performance optimization (bundle < 200KB, LCP < 1.5s)         | NEW  | 4h     | M1-M4             |
| M5-2 | Security audit (auth routes, input validation, org isolation) | NEW  | 4h     | M1-M4             |
| M5-3 | Accessibility audit (WCAG 2.1 AA)                             | NEW  | 3h     | M1-M4             |
| M5-4 | Production data migration (run M4-3 + M4-4 on production)     | NEW  | 3h     | M4-3, M4-4        |
| M5-5 | Production deployment (Vercel + Convex Cloud + domain)        | NEW  | 3h     | M5-1 through M5-3 |
| M5-6 | Monitoring setup (Sentry + Vercel Analytics)                  | NEW  | 2h     | M5-5              |
| M5-7 | Production smoke test                                         | NEW  | 2h     | M5-5, M5-6        |

### Issue: [M5-1] Performance optimization

**User Story**: As a hospital user, I want the application to load quickly, so that I can access equipment information without delay.
**Labels**: `milestone:M5`, `priority:high`, `effort:medium`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-4` -- Performance targets
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m5-4` -- Performance pattern

#### Acceptance Criteria

- [ ] Bundle size < 200KB (first load JS)
- [ ] LCP < 1.5s on consumer dashboard
- [ ] CLS < 0.1
- [ ] Lighthouse Performance > 90

---

### Issue: [M5-2] Security audit

**User Story**: As an admin, I want the application to be secure, so that patient-adjacent medical equipment data is protected.
**Labels**: `milestone:M5`, `priority:critical`, `effort:medium`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-3` -- Auth/security decisions
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m5-5` -- Security audit pattern

#### Acceptance Criteria

- [ ] Organization isolation verified (users cannot access other orgs' data)
- [ ] Auth routes protected (no unauthenticated access to data)
- [ ] Input validation on all mutations (Zod + Convex validators)
- [ ] No env var leakage in client bundle
- [ ] Rate limiting on auth endpoints
- [ ] Zero critical vulnerabilities

---

### Issue: [M5-3] Accessibility audit

**User Story**: As a hospital user with accessibility needs, I want the application to be usable, so that I can manage equipment regardless of ability.
**Labels**: `milestone:M5`, `priority:high`, `effort:medium`

#### Reference Files

- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m5-6` -- Accessibility audit pattern

#### Acceptance Criteria

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader compatibility (ARIA labels)
- [ ] Sufficient color contrast
- [ ] Lighthouse Accessibility > 90

---

### Issue: [M5-4] Production data migration

**User Story**: As an admin, I want all production data migrated to the new system, so that hospitals can continue operations without data loss.
**Labels**: `milestone:M5`, `priority:critical`, `effort:medium`

#### Reference Files

- **Schema Mapping**: `plans/medilink-migration-roadmap.md#supabase-to-convex` -- Complete migration reference

#### Acceptance Criteria

- [ ] Dry-run on production data (validation report)
- [ ] Full migration executed (all tables)
- [ ] Row count verification (source vs destination)
- [ ] Spot-check 10 records per table
- [ ] Rollback plan documented

---

### Issue: [M5-5] Production deployment

**User Story**: As a developer, I want the application deployed to production, so that hospitals can access the new system.
**Labels**: `milestone:M5`, `priority:critical`, `effort:medium`

#### Reference Files

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md#section-1` -- Deployment stack
- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m5-7` -- Deployment pattern

#### Acceptance Criteria

- [ ] Vercel production deployment configured
- [ ] Convex production deployment configured
- [ ] Custom domain configured (medilink.sangle.tech or similar)
- [ ] Environment variables set (production secrets)
- [ ] SSL certificate active

---

### Issue: [M5-6] Monitoring setup

**User Story**: As a developer, I want production monitoring, so that issues are detected and resolved quickly.
**Labels**: `milestone:M5`, `priority:high`, `effort:small`

#### Reference Files

- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m5-8` -- Monitoring pattern

#### Acceptance Criteria

- [ ] Sentry configured for error tracking
- [ ] Vercel Analytics enabled
- [ ] Vercel Speed Insights enabled
- [ ] Alert thresholds configured

---

### Issue: [M5-7] Production smoke test

**User Story**: As a developer, I want a verified production deployment, so that hospitals can be onboarded with confidence.
**Labels**: `milestone:M5`, `priority:critical`, `effort:small`

#### Reference Files

- **ProX Roadmap**: `MIGRATION_ROADMAP.md#issue-m5-9` -- Smoke test pattern

#### Acceptance Criteria

- [ ] All consumer routes load (equipment, service requests, consumables, support)
- [ ] All admin routes load (dashboard, equipment manage, providers, analytics, users)
- [ ] Auth flow works (sign up, sign in, sign out)
- [ ] Equipment CRUD works end-to-end
- [ ] Service request workflow works end-to-end
- [ ] Git tagged as `v1.0.0`

---

**Milestone 5 Exit Criteria**:

- Lighthouse: Performance > 90, Accessibility > 90
- Zero critical security vulnerabilities
- Production data migrated and verified
- Production URL live with monitoring
- Full user journey verified on production
- Git tagged as `v1.0.0`

---

### Milestone Summary

| Milestone                       | Issues | Parallel Agents | Estimated Effort | Dependencies |
| ------------------------------- | ------ | --------------- | ---------------- | ------------ |
| **M0: Infrastructure**          | 6      | 1 (sequential)  | 20h              | None         |
| **M1: Core Domain**             | 9      | 3-4             | 50h              | M0           |
| **M2: Supporting Features**     | 10     | 4-5             | 38h              | M1           |
| **M3: Rebuild Features**        | 7      | 2-3             | 43h              | M1           |
| **M4: Integration + Migration** | 6      | 2-3             | 27h              | M1-M3        |
| **M5: Polish + Launch**         | 7      | 2-3             | 21h              | M1-M4        |
| **TOTAL**                       | **45** |                 | **~199h**        |              |

**With 4 agents working in parallel**: Milestones 1-3 compress from ~131h sequential to ~50h wall clock. Total estimated calendar time: **2-3 weeks** with consistent agent execution.

---

## 6. Multi-Agent Execution Playbook

### 6.1 Core Principle: One Agent, One Issue, One Worktree

Each AI agent works on a single GitHub issue in an isolated git worktree. This prevents merge conflicts and allows true parallel execution.

```bash
# Navigate to the MediLink repo
cd /Users/sangle/Dev/action/projects/apps/medilink-convex
```

### 6.2 Batch 0: M0 Infrastructure (Sequential -- 1 Agent)

These issues build on each other. Run one at a time, in order.

```bash
# Step 1: Scaffold (no dependencies)
/start-coding-exp "#M0-1 Scaffold medilink-convex from create-t3-turbo"

# Step 2: Database (depends on #M0-1)
/start-coding-exp "#M0-2 Configure Convex with core schema"

# Step 3: Auth (depends on #M0-2)
/start-coding-exp "#M0-3 Configure Better Auth with Convex adapter"

# Step 4-6: Can run in parallel after M0-2
/start-coding-exp "#M0-4 Configure Woodpecker CI 6-stage pipeline"
/start-coding-exp "#M0-5 Configure Turborepo remote cache and Vercel"
/start-coding-exp "#M0-6 Build base UI layout with route groups"
```

**Parallel opportunity**: After M0-2 completes, run M0-3 in one terminal while running M0-4, M0-5, M0-6 in parallel (3 agents).

### 6.3 Batch 1: M1 Core Domain (4 Parallel Agents)

Must complete AFTER M0. Schema issues first, then UI in parallel.

```bash
# ┌─────────────────────────────────────────────────────────────────────┐
# │ PHASE 1: Schema (sequential -- 1 agent)                            │
# │ Estimated: 15h | Issues: M1-1 → M1-2 → M1-3                       │
# └─────────────────────────────────────────────────────────────────────┘
/start-coding-exp "#M1-1 Equipment: Convex schema + functions"
/start-coding-exp "#M1-2 Service Requests: Convex schema + functions"
/start-coding-exp "#M1-3 Providers: Convex schema + functions"

# ┌─────────────────────────────────────────────────────────────────────┐
# │ PHASE 2: UI (4 parallel agents after schema merged)                │
# └─────────────────────────────────────────────────────────────────────┘

# TERMINAL 1 -- Agent A: Equipment UI Chain
/start-coding-exp "#M1-4 Equipment: Consumer UI"
/start-coding-exp "#M1-5 Equipment: Admin UI"

# TERMINAL 2 -- Agent B: Service Request UI Chain
/start-coding-exp "#M1-6 Service Requests: Consumer UI"
/start-coding-exp "#M1-7 Service Requests: Admin UI"

# TERMINAL 3 -- Agent C: Seed Data
/start-coding-exp "#M1-8 Seed data script"

# TERMINAL 4 -- Agent D: Testing (after UI merged)
/start-coding-exp "#M1-9 E2E tests: equipment + service requests"
```

**Wall clock**: ~15h schema + ~14h UI parallel = ~29h instead of 50h sequential.

### 6.4 Batch 2: M2 Supporting Features (5 Parallel Agents)

Must complete AFTER Batch 1 (M1). All issues are independent.

```bash
# TERMINAL 1 -- Agent A: QR + Consumables
/start-coding-exp "#M2-1 QR Code: schema + functions + UI"
/start-coding-exp "#M2-2 Consumables: schema + functions + UI"

# TERMINAL 2 -- Agent B: Consumer Mgmt + Disputes
/start-coding-exp "#M2-3 Consumer Management: functions + Admin UI"
/start-coding-exp "#M2-4 Disputes: schema + functions + UI"

# TERMINAL 3 -- Agent C: Support + Audit
/start-coding-exp "#M2-5 Support: schema + functions + UI"
/start-coding-exp "#M2-6 Audit Log: schema + functions + Admin UI"

# TERMINAL 4 -- Agent D: Analytics + Payment
/start-coding-exp "#M2-7 Analytics: aggregation + Admin dashboard"
/start-coding-exp "#M2-8 Payment: schema + stub functions"

# TERMINAL 5 -- Agent E: Testing (after features merged)
/start-coding-exp "#M2-9 E2E tests: QR, consumables, disputes"
/start-coding-exp "#M2-10 VRT: initial baselines"
```

**Wall clock**: ~10h (longest chain: Agent A) instead of 38h sequential.

### 6.5 Batch 3: M3 Rebuild Features (3 Parallel Agents)

Can start as soon as M1 is complete.

```bash
# TERMINAL 1 -- Agent A: Automation Chain
/start-coding-exp "#M3-1 Automation: Convex scheduled functions + crons"
/start-coding-exp "#M3-2 Automation: Recipe builder Admin UI"

# TERMINAL 2 -- Agent B: Notifications Chain (after M3-1 merged)
/start-coding-exp "#M3-3 Notifications: Convex actions + React Email"
/start-coding-exp "#M3-4 Notifications: Consumer UI"

# TERMINAL 3 -- Agent C: AI Assistant Chain
/start-coding-exp "#M3-5 AI Assistant: CopilotKit + Convex AI actions"
/start-coding-exp "#M3-6 AI Assistant: Consumer UI"

# After features merged:
/start-coding-exp "#M3-7 E2E tests: automation, notifications, AI"
```

**Wall clock**: ~14h (longest chain: Agent A) instead of 43h sequential.
**Overlap with M2**: Batches 2 and 3 can run simultaneously since M3 only needs M1 complete.

### 6.6 Batch 4: M4 Integration + Migration (2 Agents)

Requires M1-M3 substantially complete.

```bash
# TERMINAL 1 -- Agent A: Integration
/start-coding-exp "#M4-1 Cross-feature notifications integration"
/start-coding-exp "#M4-2 Audit log integration for all mutations"

# TERMINAL 2 -- Agent B: Data Migration
/start-coding-exp "#M4-3 Data migration script: core data"
/start-coding-exp "#M4-4 Data migration script: operational data"

# After integration merged:
/start-coding-exp "#M4-5 Full E2E test suite"
/start-coding-exp "#M4-6 VRT coverage"
```

**Wall clock**: ~10h instead of 27h sequential.

### 6.7 Batch 5: M5 Polish + Launch (3 Agents -> Sequential)

Requires ALL features merged.

```bash
# PHASE 1: Audits (3 parallel agents)
# TERMINAL 1 -- Agent A:
/start-coding-exp "#M5-1 Performance optimization"

# TERMINAL 2 -- Agent B:
/start-coding-exp "#M5-2 Security audit"

# TERMINAL 3 -- Agent C:
/start-coding-exp "#M5-3 Accessibility audit"

# PHASE 2: Sequential (after audits pass)
/start-coding-exp "#M5-4 Production data migration"
/start-coding-exp "#M5-5 Production deployment"
/start-coding-exp "#M5-6 Monitoring setup"
/start-coding-exp "#M5-7 Production smoke test"
```

**Wall clock**: ~4h parallel + ~10h sequential = ~14h instead of 21h.

### 6.8 Execution Timeline Summary

| Batch     | Milestone          | Agents | Sequential Hours | Parallel Hours | Savings |
| --------- | ------------------ | ------ | ---------------- | -------------- | ------- |
| 0         | M0: Infrastructure | 1->3   | 20h              | ~12h           | 40%     |
| 1         | M1: Core Domain    | 1->4   | 50h              | ~29h           | 42%     |
| 2         | M2: Supporting     | 5      | 38h              | ~10h           | 74%     |
| 3         | M3: Rebuild        | 3      | 43h              | ~14h           | 67%     |
| 4         | M4: Integration    | 2      | 27h              | ~10h           | 63%     |
| 5         | M5: Polish         | 3->1   | 21h              | ~14h           | 33%     |
| **Total** |                    |        | **199h**         | **~89h**       | **55%** |

**Critical path** (sequential dependencies):

```
Batch 0 (12h) -> Batch 1 (29h) -> Batch 2+3 overlap (14h) -> Batch 4 (10h) -> Batch 5 (14h)
= ~79h wall clock = 2-3 weeks with consistent execution
```

### 6.9 Worktree Setup Script

```bash
#!/bin/bash
# setup-batch.sh <milestone> <issue-ids...>
# Example: ./setup-batch.sh m1 m1-1 m1-2 m1-3 m1-4

MILESTONE=$1
shift
ISSUES=("$@")

cd /Users/sangle/Dev/action/projects/apps/medilink-convex

for ISSUE in "${ISSUES[@]}"; do
    BRANCH="feat/${ISSUE}"
    WORKTREE="../medilink-${ISSUE}"

    echo "Creating worktree for ${ISSUE}..."
    git worktree add -b "$BRANCH" "$WORKTREE" main
    echo "  -> ${WORKTREE} on branch ${BRANCH}"
done

echo ""
echo "Worktrees created. Run /start-coding-exp in each directory."
```

### 6.10 Agent Configuration

Each agent receives:

1. **This roadmap** (medilink-migration-roadmap.md) -- for overall context
2. **The specific issue** -- with user story, acceptance criteria, and reference files
3. **The CLAUDE.md** -- for project conventions
4. **Access to legacy-medilink** -- for reference reading (READ-ONLY)
5. **Access to PalX** -- for Convex/auth pattern reference (READ-ONLY)

Agent permissions:

- Read any file in the monorepo
- Write only to files within their issue scope
- Run `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`
- Run `npx convex dev` and `npx convex deploy`
- Create git commits and push to their branch
- Create PR via `gh pr create`

---

## 7. Environment Variables

### Development (.env.local)

```bash
# Convex
CONVEX_DEPLOYMENT=dev:<deployment-name>
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud

# Better Auth
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXT_PUBLIC_APP_URL=http://localhost:3000

# CopilotKit (AI Assistant)
COPILOTKIT_API_KEY=ck_...
OPENAI_API_KEY=sk_...
```

### Production (Vercel Environment Variables)

```bash
# Convex
CONVEX_DEPLOYMENT=prod:<deployment-name>
NEXT_PUBLIC_CONVEX_URL=https://<production>.convex.cloud

# Better Auth
AUTH_SECRET=<production-secret>
NEXT_PUBLIC_APP_URL=https://medilink.sangle.tech

# CopilotKit
COPILOTKIT_API_KEY=ck_...
OPENAI_API_KEY=sk_...
```

### CI (Woodpecker Secrets)

```bash
# Turborepo Remote Cache
TURBO_TOKEN=<cache-token>
TURBO_API=http://turbo-cache:3000
TURBO_TEAM=medilink

# Convex
CONVEX_DEPLOYMENT=dev:<ci-deployment>

# VRT
VRT_APIURL=http://vrt-api-1:3000
VRT_PROJECT=medilink
VRT_BRANCHNAME=main
VRT_CIBUILDID=$CI_COMMIT_SHA
```

---

## 8. Success Metrics

### Launch Criteria (Milestone 5 Complete)

- [ ] All consumer routes functional (equipment, service requests, consumables, support, notifications)
- [ ] All admin routes functional (dashboard, equipment CRUD, providers, analytics, users, automation)
- [ ] 20+ E2E tests passing in CI
- [ ] 30+ VRT screenshots with approved baselines
- [ ] Lighthouse: Performance > 90, Accessibility > 90
- [ ] Zero critical security vulnerabilities
- [ ] Organization data isolation verified
- [ ] Production URL live and accessible
- [ ] Monitoring active (Sentry + Vercel Analytics)
- [ ] Production data migrated from Postgres
- [ ] Git tagged as `v1.0.0`

### Complexity Reduction Targets

| Metric                 | Current (Plugin)           | Target (T3 Turbo + Convex)       |
| ---------------------- | -------------------------- | -------------------------------- |
| Complexity Score       | 3,365                      | 400-500 (85-88% reduction)       |
| File Count             | 560-730                    | 300-400 (50% reduction)          |
| Database Tables        | 35-40                      | ~21 (Convex schema, same data)   |
| Apps                   | 2 (consumer + admin)       | 1 (single app with route groups) |
| Plugin Infrastructure  | 15 plugins + loader        | 0 (colocated feature modules)    |
| Event Bus Dependencies | 9 plugins on EventEmitter3 | 0 (Convex native reactivity)     |

---

## 9. Resources

### Documentation

| Resource         | URL                                       | Purpose                       |
| ---------------- | ----------------------------------------- | ----------------------------- |
| Convex Docs      | https://docs.convex.dev                   | Schema, functions, deployment |
| Better Auth Docs | https://better-auth.com                   | Auth configuration            |
| create-t3-turbo  | https://github.com/t3-oss/create-t3-turbo | Scaffold template             |
| CopilotKit Docs  | https://docs.copilotkit.ai                | AI assistant integration      |
| React Email      | https://react.email                       | Email templates               |
| shadcn/ui        | https://ui.shadcn.com                     | Component library             |

### Internal References

| Resource              | Path                                | Purpose                                |
| --------------------- | ----------------------------------- | -------------------------------------- |
| Architecture Standard | `ARCHITECTURE_STANDARD.md`          | T3 Turbo + Convex standard             |
| ProX Roadmap          | `MIGRATION_ROADMAP.md`              | Template for this roadmap              |
| Plugin Audit          | `research/medilink-plugin-audit.md` | Plugin classification + complexity     |
| PalX Convex Schema    | `apps/PalX/convex/schema.ts`        | Convex pattern reference               |
| PalX Auth Adapter     | `apps/PalX/convex/auth.ts`          | Better Auth + Convex pattern           |
| Legacy MediLink       | `legacy-medilink/`                  | Data models + business logic reference |

---

## Cross-References

- **Architecture Standard**: `ARCHITECTURE_STANDARD.md` (single source of truth)
- **Plugin Audit**: `research/medilink-plugin-audit.md` (Wave 0 audit data)
- **ProX Roadmap**: `MIGRATION_ROADMAP.md` (template source)
- **ProX GitHub Issues**: https://github.com/Sang-Le-Tech/prox-convex/issues (reference for issue structure)
