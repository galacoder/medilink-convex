# DISCOVERY: M0-4 Woodpecker CI -- 6-Stage Pipeline

## Current State Analysis

### Existing CI Infrastructure
- **GitHub Actions CI** (`.github/workflows/ci.yml`): 3 parallel jobs -- lint, format, typecheck
  - Uses custom composite action at `tooling/github/setup/action.yml` (pnpm + node setup)
  - Turbo remote caching via `TURBO_TEAM` + `TURBO_TOKEN` secrets
  - Triggers on: push to main, PRs, merge groups
  - **Will coexist** with new Woodpecker CI -- not replacing GitHub Actions

### Test Infrastructure (Gap)
- **No Vitest** configured anywhere in the monorepo
- **No Playwright** configured anywhere
- **No root `pnpm test` script** in package.json
- **No turbo `test` task** in turbo.json
- **2 test files** exist in `packages/validators/src/`:
  - `organizations.test.ts` -- 20+ assertions with hand-rolled test/expect runner
  - `auth.test.ts` -- similar custom runner pattern
  - Current test script: `tsx src/organizations.test.ts` (only runs one of two test files)
- **Vite 7.1.12** already in pnpm catalog -- good Vitest 3.x compatibility

### Application State
- **Node 22.21.0** pinned in `.nvmrc`, pnpm 10.19.0 in `packageManager`
- **No health endpoint** at `/api/health` -- must create for smoke testing
- **Next.js 16** with `pnpm with-env next start` available in `apps/web`
- **Default port**: 3000 (no PORT override in .env.example)
- Existing API routes: `/api/auth/[...all]`, `/api/trpc/[trpc]`

### Environment
- `.env.example` has: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- CI needs mock/placeholder values for all env vars to pass build
- `turbo.json` globalEnv includes all env vars -- turbo cache correctly invalidates on env changes

---

## Gap Analysis by Pipeline Stage

| Stage | Requirement | Current State | Action Needed |
|-------|------------|---------------|---------------|
| **1: lint+typecheck+build** | `pnpm lint && pnpm typecheck && pnpm build` | All 3 scripts exist and work | Create .env.ci for build to succeed |
| **2: unit-tests** | `pnpm test` runs Vitest | No test runner, no root script | Add Vitest, turbo test task, root script, migrate tests |
| **3: smoke-test** | App starts, `/api/health` responds 200 | No health endpoint | Create health route |
| **4: E2E** | Playwright tests | No Playwright | Placeholder -- defer to M1-8 |
| **5: VRT** | Screenshot comparison | No VRT tooling | Placeholder -- defer to M5-5 |
| **6: summary** | Pass/fail report | N/A | Echo-based summary step |

---

## Technical Decisions

### 1. Vitest over Jest
- **Rationale**: Vite 7.1.12 already in catalog; Vitest 3.x shares Vite transform pipeline
- **Benefit**: Zero Babel config, native TypeScript, ESM-first, sub-second HMR test reruns
- **Migration path**: packages/validators tests use simple assert patterns -- direct 1:1 mapping to `describe/it/expect`

### 2. Vitest Workspace (not per-package config only)
- **Rationale**: Monorepo needs centralized test orchestration for `pnpm test` at root
- **File**: `vitest.workspace.ts` at root, referencing package-level `vitest.config.ts` files
- **Benefit**: Single `turbo run test` discovers all workspace test configurations

### 3. Health Endpoint Design
- **Path**: `GET /api/health`
- **Response**: `{"status":"ok","timestamp":"<ISO>","version":"0.1.0"}`
- **No auth required** -- must be accessible without session
- **No database dependency** -- pure Next.js route, no Convex queries
- **Purpose**: Deterministic smoke test target

### 4. Woodpecker Image: `node:22-alpine`
- **Rationale**: Matches `.nvmrc` Node 22.21.0; Alpine is smallest image
- **Caveat**: Alpine lacks curl -- use `wget -q --spider` for health check or install curl
- **Alternative considered**: Custom Dockerfile with pnpm pre-installed -- rejected (over-engineering for M0)

### 5. Smoke Test Approach
- **Strategy**: `next build` in lint-typecheck-build stage, then `next start &` + wait + wget in smoke stage
- **Build reuse**: Woodpecker workspace shares files between steps -- .next/ from build stage is available to smoke
- **Timeout**: 30s wait for server startup, then health check
- **Cleanup**: Background process dies when container exits

### 6. Placeholder Stages (E2E, VRT)
- **Strategy**: Real steps with echo messages documenting which milestone will implement them
- **depends_on**: Still wired into DAG so pipeline structure is correct from day one
- **Future**: M1-8 replaces E2E echo with Playwright; M5-5 replaces VRT echo with screenshot comparison

### 7. Caching Strategy
- **pnpm store**: Not cached between pipeline runs (Woodpecker volume caching requires server-side config)
- **Turbo cache**: Uses `TURBO_TEAM` + `TURBO_TOKEN` for remote cache hits
- **node_modules**: Persists within pipeline run via shared workspace volume
- **Future optimization**: Add Woodpecker volume plugin for pnpm store if install times exceed 60s

### 8. Pipeline Trigger Conditions
- **Push to main**: Full 6-stage pipeline
- **Pull requests**: Full 6-stage pipeline (CI IS the code review)
- **No branch filtering**: All PR branches trigger pipeline

---

## File Inventory

### Files to Create
| File | Purpose | Wave |
|------|---------|------|
| `vitest.workspace.ts` | Root Vitest workspace config | 1 |
| `packages/validators/vitest.config.ts` | Validators package Vitest config | 1 |
| `apps/web/src/app/api/health/route.ts` | Health check endpoint for smoke test | 2 |
| `.env.ci` | CI-safe environment variables | 2 |
| `.woodpecker.yml` | Complete 6-stage CI pipeline | 3 |

### Files to Modify
| File | Changes | Wave |
|------|---------|------|
| `pnpm-workspace.yaml` | Add vitest + @vitest/coverage-v8 to catalog | 1 |
| `turbo.json` | Add test task, update build outputs to include .next/** | 1 |
| `package.json` | Add root test script | 1 |
| `packages/validators/package.json` | Add vitest devDep, update test script | 1 |
| `packages/validators/src/organizations.test.ts` | Migrate to vitest describe/it/expect | 1 |
| `packages/validators/src/auth.test.ts` | Migrate to vitest describe/it/expect | 1 |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Next.js build fails without real Convex URL | High | .env.ci provides placeholder CONVEX_DEPLOYMENT + NEXT_PUBLIC_CONVEX_URL |
| Smoke test timing -- server not ready in time | Medium | Use retry loop with wget instead of single check after sleep |
| Vitest version incompatibility with Vite 7.1.12 | Low | Vitest 3.x targets Vite 7.x; pin compatible version |
| Alpine image missing tools for smoke test | Low | Use wget (included in Alpine) instead of curl |
| Turbo cache miss in Woodpecker (different env) | Low | Remote cache via TURBO_TOKEN still works; local cache regenerated per run |

---

## GitHub Issue Requirements

Linked to: [#49](https://github.com/galacoder/medilink-convex/issues/49) - M0-4: Woodpecker CI -- 6-Stage Pipeline

### User Stories
| ID | Description | Status |
|----|-------------|--------|
| US-001 | As platform_admin, I want automated 6-stage CI pipeline so every code change is validated before merging | pending |

### Acceptance Criteria
- [ ] .woodpecker.yml with 6 stages: lint+typecheck+build -> tests -> smoke -> E2E -> VRT -> summary
- [ ] Stage 1: pnpm lint && pnpm typecheck && pnpm build pass
- [ ] Stage 2: pnpm test (Vitest unit tests)
- [ ] Stage 3: Smoke test (app starts, health endpoint responds)
- [ ] Stage 4: Playwright E2E tests (placeholder)
- [ ] Stage 5: VRT screenshot comparison (placeholder)
- [ ] Stage 6: Summary report (pass/fail counts, badge)
- [ ] Pipeline triggers on push to main and PRs
- [ ] Pipeline completes under 5 minutes for stages 1-3
- [ ] TypeScript types pass pnpm typecheck with zero errors in CI

> Requirements will be verified in `/verify-coding-exp` Step 1.65
