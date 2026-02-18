# Implementation Plan

**Task**: M0-5: Turborepo Remote Caching + Vercel Deployment
**Issue**: #50
**Waves**: 2
**Features**: 7
**Estimated Time**: 25 minutes
**Execution Strategy**: Unified (single agent, sequential)
**Model**: Sonnet

---

## Wave 1: Turborepo Remote Cache + CI Secrets

**Objective**: Enable Turborepo remote caching by adding TURBO_TEAM/TURBO_TOKEN to globalPassThroughEnv, fix Woodpecker CI to use from_secret references, and document missing environment variables in .env.example.

**WHY**: Remote caching is the foundation of faster CI builds. Without TURBO_TEAM/TURBO_TOKEN in globalPassThroughEnv, Turborepo silently ignores remote cache. Woodpecker CI also uses empty strings instead of secret references, so cached builds never happen on homelab CI.

**Complexity**: Low (config-only edits to JSON and YAML files)

**Model**: Sonnet

### Features

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| 1.1 | Add TURBO_TEAM/TURBO_TOKEN to globalPassThroughEnv | High | Add to turbo.json so Turborepo reads remote cache credentials from environment |
| 1.2 | Fix Woodpecker CI from_secret references | High | Replace empty-string env values with Woodpecker from_secret syntax for CI caching |
| 1.3 | Update .env.example with missing variables | Medium | Add CONVEX_SITE_URL, AUTH_REDIRECT_PROXY_URL, TURBO_TEAM/TURBO_TOKEN documentation |
| 1.4 | Align root turbo.json build outputs | Medium | Add !.next/cache/** exclusion to prevent caching large Next.js cache files |

### Files Modified
- `turbo.json` (features 1.1, 1.4)
- `.woodpecker.yml` (feature 1.2)
- `.env.example` (feature 1.3)

### Verification
- `pnpm typecheck` passes with zero errors
- `pnpm build` succeeds

---

## Wave 2: Vercel Deployment Config + Verification

**Objective**: Create vercel.json with monorepo root directory override and framework preset, then verify all changes pass typecheck and build with zero errors.

**WHY**: Vercel needs explicit configuration for monorepo deployments to know which app to build and where the root directory is. Without vercel.json, Vercel auto-detection may pick the wrong directory or build command.

**Complexity**: Low (create one config file + run verification)

**Model**: Sonnet

### Features

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| 2.1 | Create vercel.json with monorepo config | High | Tell Vercel to build from apps/web with Next.js preset |
| 2.2 | Run pnpm typecheck | High | Verify zero TypeScript errors across all workspaces (AC #9) |
| 2.3 | Run pnpm build | High | Verify monorepo builds and Turborepo output caching works |

### Files Created
- `vercel.json` (feature 2.1)

### Verification
- `pnpm typecheck` passes with zero errors
- `pnpm build` succeeds
- Second `pnpm build` shows Turborepo FULL TURBO (cache hit)

---

## Manual Steps (Post-Merge)

These steps require platform access and cannot be automated in code:

1. **Vercel**: Link project to GitHub repo via Vercel dashboard
2. **Vercel**: Set environment variables (CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL, CONVEX_SITE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_REDIRECT_PROXY_URL)
3. **Vercel**: Enable remote caching (links TURBO_TOKEN automatically)
4. **Woodpecker**: Add `turbo_team` and `turbo_token` secrets in Woodpecker admin
5. **GitHub**: Verify `TURBO_TEAM` (variable) and `TURBO_TOKEN` (secret) are set in repo settings
6. **Domain**: Configure custom domain in Vercel (if available)

---

## Decision Matrix

| Condition | Action |
|-----------|--------|
| All tests pass (0 failures) | PROCEED to next wave |
| 1-3 config errors | FIX syntax, re-verify |
| Multiple cascading errors | REDO wave with corrected approach |
| Pre-existing errors unrelated to task | ESCALATE to user |
