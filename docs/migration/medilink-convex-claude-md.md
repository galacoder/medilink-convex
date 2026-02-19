# CLAUDE.md

## Project Overview

**MediLink** is a medical equipment management system for SPMET Healthcare School built with T3 Turbo + Convex + Better Auth. Single Next.js app with route groups for role-based access (student/staff/admin), feature modules in `src/features/`, and Convex as the real-time database. Bilingual Vietnamese/English support throughout.

- **GitHub**: TBD after repository creation
- **Architecture Standard**: See `@agents/prox/architecture-decision/ARCHITECTURE_STANDARD.md`
- **Legacy Reference (READ-ONLY)**: `../project-medilink/` (Supabase + Prisma legacy)
- **School Context**: SPMET Healthcare School - medical equipment tracking and training

## Workspace Map

All packages use `@medilink/*` scope.

| Workspace                   | Path                   | Purpose                                         |
| --------------------------- | ---------------------- | ----------------------------------------------- |
| `@medilink/web`             | `apps/web/`            | Main Next.js web app (single app, route groups) |
| `@medilink/api`             | `packages/api/`        | tRPC routers (non-reactive API)                 |
| `@medilink/auth`            | `packages/auth/`       | Better Auth config + Convex adapter             |
| `@medilink/db`              | `packages/db/`         | Database schema + Convex reference types        |
| `@medilink/ui`              | `packages/ui/`         | shadcn/ui design system (Radix primitives)      |
| `@medilink/validators`      | `packages/validators/` | Zod v4 schemas (bilingual error messages)       |
| `@medilink/eslint-config`   | `tooling/eslint/`      | Shared ESLint config                            |
| `@medilink/prettier-config` | `tooling/prettier/`    | Shared Prettier config                          |
| `@medilink/tailwind-config` | `tooling/tailwind/`    | Shared Tailwind v4 config                       |
| `@medilink/tsconfig`        | `tooling/typescript/`  | Shared TypeScript configs                       |
| `@medilink/github`          | `tooling/github/`      | GitHub Actions / CI tooling                     |

## Architecture

Single Next.js app with route groups for role separation (NOT separate apps per role):

```
apps/web/src/
  app/
    (auth)/          # Public: sign-in, sign-up, forgot-password (bilingual)
    (student)/       # Student routes (view equipment, borrow, return)
    (staff)/         # Staff routes (manage equipment, approve requests)
    (admin)/         # Admin routes (users, reports, system config)
    (marketing)/     # Public: landing, about SPMET
  features/          # Feature modules (colocated, NOT packages)
    equipment/       # components/, hooks/, actions/, types.ts, index.ts
    borrowing/       # Borrow/return workflow
    patients/        # Patient records (for equipment usage tracking)
    maintenance/     # Equipment maintenance scheduling
    reports/         # Analytics and compliance reports
    admin/           # User management, system settings
  components/        # Shared: layout/, common/, providers/
  hooks/             # Shared hooks (useEquipment, useBorrowing)
  lib/               # Utilities (cn, formatDate, constants, i18n)
  trpc/              # tRPC client setup
  env.ts             # @t3-oss/env-nextjs validation
```

Feature modules live in `src/features/`, NOT as separate packages. Promote to a package ONLY when directory exceeds 50 files or 3+ apps need the same logic. Full details: `@agents/prox/architecture-decision/ARCHITECTURE_STANDARD.md`

## Development Commands

| Category   | Command                 | Description                           |
| ---------- | ----------------------- | ------------------------------------- |
| **Build**  | `pnpm build`            | Build all workspaces via Turbo        |
| **Dev**    | `pnpm dev`              | Watch all apps + packages             |
| **Dev**    | `pnpm dev:web`          | Watch Next.js app + dependencies only |
| **Lint**   | `pnpm lint`             | ESLint all workspaces (cached)        |
| **Lint**   | `pnpm lint:fix`         | ESLint with auto-fix                  |
| **Lint**   | `pnpm lint:ws`          | Workspace dependency check (sherif)   |
| **Format** | `pnpm format`           | Prettier check (cached)               |
| **Format** | `pnpm format:fix`       | Prettier write                        |
| **Type**   | `pnpm typecheck`        | TypeScript check all workspaces       |
| **DB**     | `pnpm db:push`          | Push schema to database               |
| **DB**     | `pnpm db:studio`        | Open database studio                  |
| **Auth**   | `pnpm auth:generate`    | Generate Better Auth types            |
| **UI**     | `pnpm ui-add`           | Add shadcn/ui component               |
| **Clean**  | `pnpm clean`            | Remove root node_modules              |
| **Clean**  | `pnpm clean:workspaces` | Remove all workspace build artifacts  |

### Convex Commands

```bash
npx convex dev          # Start Convex dev server (run in separate terminal)
npx convex deploy       # Deploy to production
npx convex typecheck    # Type check Convex functions
```

**Convex conventions**: timestamps use `v.number()` (epoch ms), enums use `v.union(v.literal())`, indexes use `by_` prefix, all tables include `createdAt`/`updatedAt`. Invoke skill: `developing-with-convex`

## Environment Variables

Source of truth: `.env.example`. Copy to `.env` and populate with secrets.

| Variable             | Purpose                         | Context                             |
| -------------------- | ------------------------------- | ----------------------------------- |
| `CONVEX_DEPLOYMENT`  | Convex deployment URL           | Get from Convex dashboard           |
| `CONVEX_DEPLOY_KEY`  | Convex deploy key               | For CI/CD                           |
| `AUTH_SECRET`        | Better Auth session signing key | Generate: `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID`     | Google OAuth client ID          | Optional, for social login          |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret      | Optional, for social login          |

**Turbo globalEnv** (in `turbo.json`): `CONVEX_DEPLOYMENT`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `PORT`

**Turbo globalPassThroughEnv**: `NODE_ENV`, `CI`, `VERCEL`, `VERCEL_ENV`, `VERCEL_URL`, `npm_lifecycle_event`

## Agent Scoping Rules

For parallel multi-agent execution via git worktrees:

| Scope         | Can Edit                                    | Cannot Edit                               |
| ------------- | ------------------------------------------- | ----------------------------------------- |
| Feature agent | `src/features/<name>/`, route group pages   | Other features, shared components, schema |
| Schema agent  | `convex/schema.ts`, `packages/db/`          | Feature code, UI components               |
| UI agent      | `packages/ui/`, `src/components/`           | Business logic, schema, API routes        |
| API agent     | `packages/api/`, `convex/*.ts` (not schema) | UI, features, tooling                     |
| Tooling agent | `tooling/`, root configs                    | Application code                          |

**Execution limits**:

- `max_turns`: 100 (implementation), 50 (content), 30 (research)
- Context budget: task content < 60% of 200K tokens
- One agent, one issue, one worktree
- Schema additions are append-only (never modify existing tables)
- Feature modules are isolated directories

**MCP limitation**: Background subagents cannot access MCP tools (Playwright, Notion, etc.). Use Playwright CLI for headless verification.

## Git Workflow

- Branch from `main`: `feat/<scope>/<description>` (e.g., `feat/equipment/tracking-schema`)
- Worktree location: `../medilink-convex-<branch>/`
- Run `pnpm install` after creating worktree
- Commit format: `type(scope): description (#issue)`
- Squash merge via GitHub, delete branch after merge
- CI must pass (6-stage pipeline: lint + typecheck + build -> tests -> smoke -> E2E -> VRT -> summary)
- PRs target `main` (no develop branch)

<critical_rules>

- NEVER commit .env files, secrets, or API keys
- ALWAYS use workspace:\* protocol for internal package dependencies
- ALWAYS run pnpm typecheck before creating PRs
- NEVER access Convex database directly from client -- use query/mutation functions
- ALWAYS include createdAt/updatedAt on new Convex tables
- NEVER modify existing Convex tables in schema -- only append new tables
- ALWAYS use Server Components by default (Next.js App Router)
- TypeScript strict mode everywhere, no `any`
- Prefer named exports over default exports
- ALWAYS provide bilingual labels (Vietnamese primary, English secondary)
- NEVER hardcode Vietnamese text without English translation comments
- UTF-8 encoding required for all files (for Vietnamese diacritics)
- Medical equipment safety codes must follow Vietnamese medical device regulations
- Patient data must comply with Vietnamese Personal Data Protection Decree 13/2023
  </critical_rules>

## Skills Library

| Skill                             | Use For                                                           |
| --------------------------------- | ----------------------------------------------------------------- |
| `developing-with-convex`          | Schema design, queries, mutations, real-time subscriptions        |
| `building-with-turborepo`         | Monorepo config, turbo.json, remote caching                       |
| `developing-with-nextjs`          | App Router, Server Components, route groups                       |
| `authenticating-with-better-auth` | Auth flow, Convex adapter, session management                     |
| `building-with-shadcn-ui`         | UI components, Radix primitives, Tailwind v4                      |
| `building-ui-templates`           | 704 pre-built UI templates (PREFERRED over building from scratch) |
| `developing-healthcare-apps`      | Healthcare compliance, patient data handling, medical workflows   |

## Migration Context

- **Status**: Legacy MediLink (`../project-medilink/`) uses Supabase + Prisma - READ-ONLY reference
- **Migration Path**: Supabase PostgreSQL -> Convex (schema mapping, data import)
- **Data Layer Split**: Convex (reactive queries/mutations/subscriptions) + tRPC (non-reactive: webhooks, external APIs)
- **Legacy Features to Preserve**:
  - Equipment tracking (Supabase table -> Convex equipment table)
  - Borrowing workflow (Supabase borrowing + approval -> Convex borrowing + real-time status)
  - Patient records (Supabase patients -> Convex patients with privacy controls)
  - Maintenance scheduling (Supabase maintenance -> Convex maintenance + notifications)
  - User roles (Supabase auth + roles -> Better Auth + Convex role checks)
- **New Features (Convex-enabled)**:
  - Real-time equipment availability dashboard
  - Live borrow/return notifications
  - Collaborative maintenance scheduling
  - Real-time compliance reports
- **Bilingual Requirements**: All UI strings, validation errors, and reports must support Vietnamese (primary) + English (secondary)
- **School Context**: SPMET Healthcare School (Ho Chi Minh City) - see legacy CLAUDE.md for mission, programs, contact details

## Healthcare Domain Rules

**Equipment Safety**:

- Equipment status must include: Available, In Use, Maintenance, Damaged, Retired
- Maintenance schedules must send alerts 7 days and 1 day before due date
- Damaged equipment must be immediately flagged and removed from borrowing pool

**Patient Privacy**:

- Patient records are scoped by `patientId` + `organizationId` (for future multi-school support)
- Patient PII (name, contact) encrypted at rest (Convex field-level encryption)
- Access logs for all patient record views (audit trail)

**Compliance**:

- Equipment usage logs retained for 5 years (Vietnamese medical device regulations)
- Monthly reports: equipment utilization, maintenance completion, overdue items
- Export format: Vietnamese labels + English labels (dual-column CSV)

## Code Style

- TypeScript strict mode, no `any`
- Prefer `interface` over `type` for objects
- Use Server Components by default (Next.js App Router)
- Prefer named exports over default exports
- Feature boundaries enforced by `eslint-plugin-boundaries`
- Invoke skill: `test-driven-development` for testing patterns
- Bilingual constants: `const LABELS = { vi: "Thiết bị", en: "Equipment" }`
- Date formats: Vietnamese locale `vi-VN` for display, ISO 8601 for storage

## Bilingual Content Pattern

**UI Labels** (Vietnamese primary, English fallback):

```typescript
// lib/i18n/labels.ts
export const labels = {
  equipment: { vi: "Thiết bị y tế", en: "Medical Equipment" },
  borrow: { vi: "Mượn", en: "Borrow" },
  return: { vi: "Trả", en: "Return" },
  // ... all UI labels
};

// Component usage
<Button>{labels.borrow[locale]}</Button>
```

**Validation Errors** (Zod with bilingual messages):

```typescript
// packages/validators/src/equipment.ts
export const equipmentSchema = z.object({
  name: z.string().min(3, {
    message: {
      vi: "Tên phải có ít nhất 3 ký tự",
      en: "Name must be at least 3 characters",
    },
  }),
});
```

**Database Content** (store both languages):

```typescript
// convex/schema.ts
equipmentCategory: defineTable({
  nameVi: v.string(), // Vietnamese name (primary)
  nameEn: v.string(), // English name (secondary)
  descriptionVi: v.string(),
  descriptionEn: v.string(),
});
```

## School Context (SPMET Healthcare)

**Mission**: Train healthcare professionals in medical equipment operation and patient care. MediLink tracks equipment usage for student training and patient simulation labs.

**User Roles**:

- **Student**: Borrow equipment for training, view availability, submit return reports
- **Staff**: Approve borrow requests, manage equipment inventory, schedule maintenance
- **Admin**: Manage users, configure system, generate compliance reports

**Equipment Categories**: Diagnostic devices, patient monitoring, surgical instruments, rehabilitation equipment, training simulators

**Workflow**: Student requests equipment -> Staff approves -> Student uses equipment -> Student returns + submits usage report -> Staff verifies condition -> Equipment available again

**Legacy Reference**: See `../project-medilink/.claude/docs/medilink-school-context.md` for complete SPMET information (mission, programs, contact details)

---

**Migration from Legacy MediLink**: This repository replaces `project-medilink` (Supabase + Prisma). Legacy codebase is READ-ONLY reference for business logic and bilingual content. All new development follows T3 Turbo + Convex standard.
