# Plan: M0-1 Clone and Configure T3 Turbo Template

## Summary

Scaffold the MediLink monorepo from the create-t3-turbo template by renaming the @acme/* package scope to @medilink/*, restructuring app directories (rename apps/nextjs/ to apps/web/, remove apps/tanstack-start/), removing the Drizzle/Prisma database layer (replaced by Convex), and verifying the entire Turborepo build pipeline passes cleanly. This is a blocking M0 milestone that 5 downstream issues depend on.

## Wave 1: Directory Restructuring

**Objective**: Rename apps/nextjs/ to apps/web/, remove apps/tanstack-start/, and update path references.

**Why**: All subsequent file edits reference the new directory structure. Renaming and cleanup must happen first to avoid editing files that will move or be deleted.

**Tasks**:
1. `git mv apps/nextjs apps/web` - Rename with history preservation
2. `rm -rf apps/tanstack-start/` - Remove unused TanStack Start app
3. Update `.vscode/launch.json` cwd from `apps/nextjs` to `apps/web`
4. Update root `package.json` dev:next script filter

**Files Modified**:
- apps/nextjs/ -> apps/web/ (directory rename)
- apps/tanstack-start/ (deleted)
- .vscode/launch.json
- package.json (root)

## Wave 2: Scope Rename @acme/* to @medilink/*

**Objective**: Replace all @acme/* references with @medilink/* across the entire monorepo.

**Why**: The @acme scope is the T3 Turbo template default. MediLink needs its own package identity for workspace resolution, imports, and tooling configuration.

**Tasks**:
1. Update all 14 package.json name and dependency fields
2. Update all 11 tsconfig.json extends references
3. Update all 9+ eslint.config.ts import paths
4. Update 25+ source file imports in apps/ and packages/
5. Update turbo/generators templates and config.ts
6. Update tooling/prettier/index.js import order patterns

**Files Modified** (36+ files):
- All package.json files (14)
- All tsconfig.json files (11)
- All eslint.config.ts files (9+)
- All source files with @acme imports (25+)
- turbo/generators/config.ts
- turbo/generators/templates/*.hbs (3)
- tooling/prettier/index.js

**Verification**: `grep -r '@acme/' --exclude-dir=node_modules` should return zero results.

## Wave 3: Remove Drizzle/Prisma, Prep for Convex

**Objective**: Remove all Drizzle ORM boilerplate and prepare for Convex database integration.

**Why**: MediLink uses Convex for real-time data instead of PostgreSQL/Drizzle. Leaving Drizzle code would confuse developers and cause build failures when POSTGRES_URL is not set.

**Tasks**:
1. Gut packages/db/ source files (replace with minimal Convex-ready exports)
2. Remove Drizzle dependencies from packages/db/package.json
3. Update turbo.json (remove push/studio tasks, update globalEnv)
4. Update .env.example (POSTGRES_URL -> CONVEX_DEPLOYMENT)
5. Update apps/web/src/env.ts (remove POSTGRES_URL validation)

**Files Modified**:
- packages/db/src/schema.ts (gutted)
- packages/db/src/client.ts (gutted)
- packages/db/src/auth-schema.ts (gutted)
- packages/db/src/index.ts (simplified)
- packages/db/drizzle.config.ts (removed)
- packages/db/package.json (cleaned)
- turbo.json
- .env.example
- apps/web/src/env.ts

## Wave 4: Build Verification and Polish

**Objective**: Run the full build pipeline and fix any remaining issues.

**Why**: This milestone blocks 5 downstream issues. Every acceptance criterion must pass before merging.

**Tasks**:
1. `pnpm install` - Verify dependency resolution
2. `pnpm typecheck` - Verify zero TypeScript errors
3. `pnpm build` - Verify clean production build
4. `pnpm lint` - Verify zero lint errors
5. Verify apps/expo/ retained, apps/web/ functional

**Acceptance Criteria** (from GitHub Issue #46):
- [x] pnpm install succeeds with zero errors
- [x] pnpm build produces clean production build
- [x] Package scope is @medilink/* in all package.json files
- [x] Drizzle/Prisma references removed
- [x] turbo.json configured with build/dev/lint/typecheck tasks
- [x] pnpm-workspace.yaml lists apps/* and packages/*
- [x] apps/nextjs/ renamed to apps/web/
- [x] apps/tanstack-start/ removed
- [x] apps/expo/ retained
- [x] TypeScript types pass pnpm typecheck with zero errors
