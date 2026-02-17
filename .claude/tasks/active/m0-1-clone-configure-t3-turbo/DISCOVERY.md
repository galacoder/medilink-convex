# Discovery Report

**Task**: M0-1: Clone and Configure T3 Turbo Template
**Domain**: coding
**Date**: 2026-02-17T16:30:00Z

## Key Findings

The worktree contains a fresh clone of create-t3-turbo with the standard @acme/* scope. The monorepo has 3 apps (nextjs, expo, tanstack-start), 5 packages (api, auth, db, ui, validators), and 6 tooling packages (eslint, prettier, tailwind, typescript, github). A total of 36+ files contain @acme/ references that must be renamed to @medilink/.

The packages/db/ workspace contains full Drizzle ORM boilerplate (schema with Post table, Vercel Postgres client, auth-schema integration, drizzle-kit config). This entire layer must be removed since MediLink uses Convex for its real-time database needs.

No test framework is configured. CI only runs lint, format, and typecheck. Verification for this task is limited to build pipeline commands.

## Dependencies Identified

- **pnpm**: ^10.19.0 (workspace manager)
- **node**: ^22.21.0 (runtime)
- **turbo**: ^2.5.8 (build orchestration)
- **drizzle-orm**: ^0.44.7 (TO BE REMOVED)
- **drizzle-kit**: ^0.31.5 (TO BE REMOVED)
- **@vercel/postgres**: ^0.10.0 (TO BE REMOVED)
- **better-auth**: 1.4.0-beta.9 (KEEP - auth layer)
- **zod**: ^4.1.12 via catalog (KEEP - validation)

## Risks Assessed

| Risk | Severity | Mitigation |
|------|----------|------------|
| Missed @acme/ reference breaks build | High | Grep verification after scope rename wave |
| packages/api imports from @medilink/db/schema break | High | Update or stub exports in packages/db |
| Expo app breaks from shared package changes | Medium | Verify apps/expo/ builds in Wave 4 |
| Generator templates lose Handlebars syntax | Low | Careful find-and-replace preserving {{ }} |
| pnpm workspace resolution failure | High | Run pnpm install after each structural wave |

## Environment Setup

- **Project Type**: TypeScript monorepo (Turborepo + pnpm workspaces)
- **Setup Commands**: `pnpm install`
- **Build Status**: Not yet verified in worktree
- **Node Version**: ^22.21.0
- **Package Manager**: pnpm ^10.19.0

## Recommended Tools

| Tool | Relevance | Wave | Purpose |
|------|-----------|------|---------|
| building-with-turborepo | 90% | 1-4 | Monorepo pipeline and workspace patterns |
| developing-with-convex | 72% | 3 | Convex project structure for DB replacement |
| Bash | Core | 1-4 | Directory operations, grep verification, build commands |
| Read/Edit | Core | 1-4 | File reading and editing for scope rename |
| Grep | Core | 2-4 | Finding stale @acme/ references |

## Recommendations

1. **Execute waves strictly sequentially** - Directory restructuring (Wave 1) must complete before scope rename (Wave 2), which must complete before Drizzle removal (Wave 3). Each wave builds on the previous.

2. **Use git mv for directory rename** - Preserves git history for apps/nextjs/ to apps/web/ transition.

3. **Verify with grep after each wave** - Run `grep -r '@acme/' --exclude-dir=node_modules` to catch any missed references. One stale reference will break the entire build.

4. **Keep packages/db/ structure intact** - Other packages depend on @medilink/db exports. Replace Drizzle content with minimal placeholder exports rather than deleting the package entirely.

5. **Update prettier import order early** - The tooling/prettier/index.js has @acme import ordering rules that affect code formatting across the entire monorepo.

---

## GitHub Issue Requirements

Linked to: [#46](https://github.com/galacoder/medilink-convex/issues/46) - M0-1: Clone and Configure T3 Turbo Template

### Verification Checklist
- [ ] pnpm install succeeds with zero errors
- [ ] pnpm dev starts Next.js on localhost:3000
- [ ] pnpm build produces clean production build
- [ ] Package scope is @medilink/* in all package.json files
- [ ] Convex dev server starts with npx convex dev
- [ ] Drizzle/Prisma references removed
- [ ] turbo.json configured with build/dev/lint/typecheck tasks
- [ ] pnpm-workspace.yaml lists apps/* and packages/*
- [ ] Rename apps/nextjs/ to apps/web/
- [ ] Remove apps/tanstack-start/ directory
- [ ] Verify apps/expo/ is retained
- [ ] Update all workspace references after directory rename
- [ ] TypeScript types pass pnpm typecheck with zero errors

### Dependencies
- **Depends on**: None (first milestone task)
- **Blocks**: M0-2 (#47), M0-3 (#48), M0-4 (#49), M0-5 (#50), M0-6 (#51)

> Requirements will be verified in `/verify-coding-exp` Step 1.65
