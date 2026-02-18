# PLAN: M0-4 Woodpecker CI -- 6-Stage Pipeline

## Problem Analysis

MediLink needs automated CI that acts as the sole quality gate -- no human code review, CI IS the reviewer. The project currently has a minimal GitHub Actions CI (lint, format, typecheck) but needs a comprehensive Woodpecker CI pipeline with 6 stages covering the full quality spectrum: static analysis, unit tests, smoke tests, E2E, VRT, and a summary report.

**Core problem**: The test infrastructure does not exist yet. There is no test runner (Vitest), no root test script, no turbo test task, and no health endpoint for smoke testing. These prerequisites must be built before the pipeline can reference them.

**Dependency chain**: Vitest setup (Wave 1) -> Health endpoint + CI env (Wave 2) -> Pipeline YAML (Wave 3).

---

## Acceptance Criteria Checklist

From GitHub Issue #49:

- [ ] **AC-1**: `.woodpecker.yml` with 6 stages: lint+typecheck+build -> tests -> smoke -> E2E -> VRT -> summary
- [ ] **AC-2**: Stage 1: `pnpm lint && pnpm typecheck && pnpm build` pass
- [ ] **AC-3**: Stage 2: `pnpm test` (Vitest unit tests)
- [ ] **AC-4**: Stage 3: Smoke test (app starts, health endpoint responds)
- [ ] **AC-5**: Stage 4: Playwright E2E tests (placeholder)
- [ ] **AC-6**: Stage 5: VRT screenshot comparison (placeholder)
- [ ] **AC-7**: Stage 6: Summary report (pass/fail counts, badge)
- [ ] **AC-8**: Pipeline triggers on push to main and PRs
- [ ] **AC-9**: Pipeline completes under 5 minutes for stages 1-3
- [ ] **AC-10**: TypeScript types pass `pnpm typecheck` with zero errors in CI

---

## Implementation Approach

### Strategy: Bottom-up prerequisite building

1. **First**: Build the test runner infrastructure (Vitest + turbo integration)
2. **Then**: Create the smoke test target (health endpoint) and CI environment
3. **Finally**: Wire everything together in the Woodpecker pipeline YAML

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Test runner | Vitest 3.x | Vite 7.1.12 already in catalog; native TS, ESM-first |
| Docker image | `node:22-alpine` | Matches .nvmrc; smallest footprint |
| Health check tool | `wget` (not curl) | Pre-installed in Alpine; no extra dependencies |
| Smoke test method | `next start &` + retry loop | Reuses .next/ build from Stage 1; deterministic |
| E2E/VRT stages | Echo placeholders | Correct DAG structure from day one; M1-8 and M5-5 fill them in |
| Caching | Turbo remote cache | `TURBO_TEAM` + `TURBO_TOKEN` already configured; no Woodpecker volume plugin needed |

---

## Wave Breakdown

### Wave 1: Test Infrastructure Foundation
**Complexity**: Medium | **Model**: Sonnet | **Estimate**: 25 min

**Objective**: Establish Vitest as the monorepo test runner with turbo integration and migrate existing hand-rolled tests.

**Steps**:
1. Add `vitest` and `@vitest/coverage-v8` to `pnpm-workspace.yaml` catalog
2. Add `test` task to `turbo.json` with `dependsOn: ["^build"]`
3. Update `turbo.json` build outputs to include `.next/**` for Next.js caching
4. Add `"test": "turbo run test"` to root `package.json` scripts
5. Create `vitest.workspace.ts` at repo root
6. Create `packages/validators/vitest.config.ts`
7. Add `vitest` as devDependency to `packages/validators/package.json` (via `catalog:`)
8. Migrate `organizations.test.ts` from custom runner to `describe/it/expect`
9. Migrate `auth.test.ts` from custom runner to `describe/it/expect`
10. Update `packages/validators` test script from `tsx` to `vitest run`
11. Run `pnpm install` to update lockfile
12. Verify: `pnpm test` passes at root

**Files modified**: `pnpm-workspace.yaml`, `turbo.json`, `package.json`, `packages/validators/package.json`, `packages/validators/src/organizations.test.ts`, `packages/validators/src/auth.test.ts`
**Files created**: `vitest.workspace.ts`, `packages/validators/vitest.config.ts`

**Satisfies**: AC-3 (pnpm test works)

---

### Wave 2: Smoke Test Prerequisites
**Complexity**: Low | **Model**: Sonnet | **Estimate**: 10 min

**Objective**: Create the health endpoint and CI environment file that the pipeline smoke test stage references.

**Steps**:
1. Create `apps/web/src/app/api/health/route.ts`:
   - GET handler returning `{ status: "ok", timestamp: new Date().toISOString(), version: "0.1.0" }`
   - No auth required, no database dependency
   - Export named `GET` function (Next.js App Router convention)
2. Create `.env.ci`:
   - Copy from `.env.example` structure
   - Set `CONVEX_DEPLOYMENT=dev:placeholder-for-ci` (or empty -- test if build tolerates it)
   - Set `NEXT_PUBLIC_CONVEX_URL=https://placeholder.convex.cloud`
   - Set `AUTH_SECRET=ci-test-secret-not-for-production`
   - Set Google OAuth vars to empty strings
3. Verify: `pnpm typecheck` still passes with new health route

**Files created**: `apps/web/src/app/api/health/route.ts`, `.env.ci`

**Satisfies**: AC-4 (health endpoint exists for smoke test)

---

### Wave 3: Woodpecker CI 6-Stage Pipeline
**Complexity**: High | **Model**: Sonnet | **Estimate**: 30 min

**Objective**: Create the complete `.woodpecker.yml` with all 6 stages, proper DAG ordering, and Node 22 Alpine setup.

**Pipeline Architecture**:

```
[setup] ----+---> [lint-typecheck-build] ---> [smoke-test] --+--> [e2e] --+--> [summary]
            |                                                |            |
            +---> [unit-tests] ------------------------------+---> [vrt] -+
```

**Steps**:
1. Create `.woodpecker.yml` with:
   - `when`: triggers on push to main + pull_request events
   - **Step: setup** -- `corepack enable`, `pnpm install --frozen-lockfile`, `cp .env.ci .env`
   - **Step: lint-typecheck-build** (Stage 1) -- `pnpm lint`, `pnpm typecheck`, `pnpm build`; depends_on: [setup]
   - **Step: unit-tests** (Stage 2) -- `pnpm test`; depends_on: [setup] (parallel with Stage 1)
   - **Step: smoke-test** (Stage 3) -- build Next.js, start server, retry wget, verify; depends_on: [lint-typecheck-build]
   - **Step: e2e** (Stage 4) -- placeholder echo; depends_on: [smoke-test, unit-tests]
   - **Step: vrt** (Stage 5) -- placeholder echo; depends_on: [smoke-test, unit-tests]
   - **Step: summary** (Stage 6) -- aggregate report; depends_on: [e2e, vrt]
2. Add `TURBO_TEAM` and `TURBO_TOKEN` as pipeline-level secrets
3. Set `FORCE_COLOR: 3` for colored CI output
4. Use `node:22-alpine` as image for all steps
5. Verify YAML syntax with a local linter or manual review

**Files created**: `.woodpecker.yml`

**Satisfies**: AC-1, AC-2, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10

---

## Verification Plan

After all waves complete:

1. **Local verification**:
   - `pnpm test` passes (Wave 1 output)
   - `pnpm typecheck` passes (no regressions)
   - `pnpm build` passes (no regressions)
   - Health endpoint returns 200 at `/api/health` (Wave 2 output)
   - `.woodpecker.yml` YAML is valid (Wave 3 output)

2. **CI verification** (after PR push):
   - All 6 Woodpecker stages execute in correct order
   - Stages 1-3 complete under 5 minutes
   - Placeholder stages (4, 5) pass with echo messages
   - Summary stage reports all-pass

3. **Acceptance criteria mapping**:
   - AC-1 through AC-10 verified via CI run

---

## Notes

- The existing `.github/workflows/ci.yml` is NOT being replaced. Woodpecker CI runs in addition to GitHub Actions. This is intentional -- GitHub Actions handles GitHub-specific checks, Woodpecker handles the comprehensive 6-stage pipeline.
- E2E (Stage 4) and VRT (Stage 5) are intentional placeholders. They will be implemented in milestones M1-8 and M5-5 respectively. The pipeline DAG structure is correct from day one so future PRs only need to replace echo commands with real test commands.
- The `.env.ci` file is committed to the repo (unlike `.env`). It contains only placeholder values safe for public repositories. Real secrets are injected as Woodpecker secrets at runtime.
