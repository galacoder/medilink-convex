# Discovery Report

**Task**: M0-5: Configure Turborepo Remote Caching and Vercel Deployment
**Domain**: coding (infrastructure config)
**Date**: 2026-02-17
**Issue**: #50

## Key Findings

1. **Remote caching is silently disabled**: `turbo.json` has `globalPassThroughEnv` but is missing `TURBO_TEAM` and `TURBO_TOKEN`. Without these, Turborepo ignores remote cache credentials even when set in the environment.

2. **Woodpecker CI uses empty strings instead of secrets**: `.woodpecker.yml` sets `TURBO_TEAM: ""` and `TURBO_TOKEN: ""` as literal empty strings. These need to use Woodpecker's `from_secret` syntax to inject actual values from the Woodpecker secrets store.

3. **GitHub Actions CI already correct**: `.github/workflows/ci.yml` properly references `${{ vars.TURBO_TEAM }}` and `${{ secrets.TURBO_TOKEN }}`. This serves as the reference pattern for the Woodpecker fix.

4. **Root vs web turbo.json output mismatch**: Root `turbo.json` includes `.next/**` in build outputs (capturing the entire `.next` directory including cache). `apps/web/turbo.json` correctly uses `!.next/cache/**` exclusion. Since apps/web extends root, the web app override works, but the root pattern should be aligned for clarity.

5. **Missing env vars in .env.example**: The `.env.ci` file has `CONVEX_SITE_URL` and `AUTH_REDIRECT_PROXY_URL` but `.env.example` does not document these. Developers cloning the repo will not know these are needed.

6. **No vercel.json exists**: Vercel deployment requires explicit monorepo configuration to locate the correct app directory (`apps/web`) and use the right build command.

7. **Next.js config is Vercel-ready**: `apps/web/next.config.js` uses standard `transpilePackages`, jiti-based env validation, and `typescript.ignoreBuildErrors: true` (CI handles typecheck separately). No modifications needed.

## Dependencies Identified

- **Turborepo v2.5.8**: Already installed as devDependency
- **Vercel Platform**: Requires Vercel account and project linking (manual step)
- **Woodpecker CI Secrets**: Requires `turbo_team` and `turbo_token` secrets configured in Woodpecker admin panel (manual step)
- **GitHub Repository Variables**: `TURBO_TEAM` (vars) and `TURBO_TOKEN` (secrets) must be set in GitHub repo settings (manual step)

## Risks Assessed

| Risk | Severity | Mitigation |
|------|----------|------------|
| Woodpecker from_secret syntax error | Low | Validate against Woodpecker docs; syntax is well-documented |
| Vercel build fails due to missing env vars | Medium | vercel.json does not set env vars; they must be configured in Vercel dashboard manually |
| .env validation blocks build without CONVEX vars | Medium | .env.ci provides placeholder values; build uses .env.ci in CI context |
| Remote cache not available without Vercel account | Low | Remote caching is opt-in; builds work fine without it, just slower |

## Environment Setup

- **Project Type**: Node.js 22 monorepo (Turborepo + pnpm workspaces)
- **Package Manager**: pnpm 10.19.0
- **Build System**: Turborepo 2.5.8
- **CI Systems**: Woodpecker CI (homelab) + GitHub Actions (cloud)
- **Build Status**: Assumed passing (M0-4 CI pipeline is latest commit on main)

## Recommended Tools

| Tool | Relevance | Wave | Purpose |
|------|-----------|------|---------|
| building-with-turborepo | 92% | 1-2 | Turbo remote cache config patterns |
| Read/Edit/Bash (core) | 100% | 1-2 | File modifications and verification |

## Recommendations

1. **Wave 1 first**: Fix turbo.json and CI configs before creating vercel.json, since Vercel config depends on correct Turborepo setup.
2. **Keep next.config.js unchanged**: It is already Vercel-compatible. The issue listed `apps/web/next.config.ts` but the actual file is `.js` - no changes needed.
3. **Manual steps post-merge**: Document that Vercel project linking, environment variable setup in Vercel dashboard, Woodpecker secrets, and custom domain configuration are manual steps done after this PR merges.
4. **Use sonnet for both waves**: Even though these are config edits, YAML secret syntax and vercel.json structure benefit from sonnet's reliability over haiku.

## GitHub Issue Requirements

Linked to: [#50](https://github.com/sangle/medilink-convex/issues/50) - M0-5: Turborepo Remote Caching + Vercel Deployment

### Acceptance Criteria Mapping

| AC# | Criterion | Wave | Feature | Notes |
|-----|-----------|------|---------|-------|
| 1 | Turborepo remote cache configured | 1 | 1.1, 1.2 | turbo.json + CI secrets |
| 2 | turbo.json has correct outputs for all tasks | 1 | 1.4 | Align root with apps/web |
| 3 | Second build is cache-hit (under 5s) | 2 | 2.3 | Requires TURBO_TOKEN set; verified by running build twice |
| 4 | Vercel project linked to repo | 2 | 2.1 | vercel.json created; manual linking in dashboard |
| 5 | Preview deploys on every PR | - | - | Vercel default behavior once project linked |
| 6 | Production deploy on push to main | - | - | Vercel default behavior once project linked |
| 7 | Env vars configured in Vercel | 1 | 1.3 | .env.example documents all vars; manual Vercel dashboard setup |
| 8 | Custom domain configured | - | - | Manual step post-merge (if domain available) |
| 9 | pnpm typecheck zero errors | 2 | 2.2 | Verification step |

> AC 3-6 and 8 require manual platform configuration after code changes merge. This task delivers the code-side configuration.
