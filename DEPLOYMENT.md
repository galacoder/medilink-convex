# MediLink Production Deployment Guide

This document covers the end-to-end process for deploying MediLink to production
(Vercel + Convex). Target audience: SPMET Healthcare School technical staff.

Documentation language: English (technical standard for deployment operations).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [First-Time Deployment](#first-time-deployment)
4. [Routine Deployment](#routine-deployment)
5. [Secret Rotation Procedure](#secret-rotation-procedure)
6. [Rollback Procedure](#rollback-procedure)
7. [Health Monitoring](#health-monitoring)
8. [On-Call Runbook](#on-call-runbook)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.9+ | Runtime |
| pnpm | 10+ | Package manager |
| Vercel CLI | latest | Deployment |
| Convex CLI | latest | Backend deployment |
| GitHub CLI | latest | Repository operations |

Accounts required:
- Vercel account with project linked to `galacoder/medilink-convex`
- Convex account with production deployment configured
- Sentry account for error monitoring (optional but recommended)

---

## Environment Setup

### 1. Copy the environment template

```bash
cp .env.example .env
```

### 2. Populate required variables

Run the validation script to check which variables are missing:

```bash
node -e "
const { validateProductionEnv } = require('./apps/web/src/lib/env-validation');
const result = validateProductionEnv();
if (!result.valid) {
  console.error(result.errorSummary);
  process.exit(1);
}
console.log('All required environment variables are set.');
"
```

### 3. Required Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment ID (from dashboard) |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex HTTP API URL for browser clients |
| `AUTH_SECRET` | Yes | Better Auth session signing key |
| `CONVEX_SITE_URL` | Yes | Convex site URL for OAuth callbacks |
| `NEXT_PUBLIC_SENTRY_DSN` | Recommended | Sentry error monitoring DSN |
| `SENTRY_AUTH_TOKEN` | CI only | For source map uploads |
| `NEXT_PUBLIC_APP_VERSION` | Recommended | Git SHA/version for health check |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client secret |
| `AUTH_REDIRECT_PROXY_URL` | Optional | OAuth redirect proxy for multi-region |

### 4. Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

Store the output as `AUTH_SECRET`. Never commit this to version control.

---

## First-Time Deployment

### Step 1: Set up Convex production deployment

```bash
# Login to Convex
npx convex login

# Deploy schema and functions to production
npx convex deploy --prod
```

Note the deployment URL (format: `https://<name>.convex.cloud`). This is
your `NEXT_PUBLIC_CONVEX_URL`.

### Step 2: Configure Vercel environment variables

Go to Vercel Dashboard → Project → Settings → Environment Variables.
Add all required variables from the table above.

Alternatively, use the Vercel CLI:

```bash
vercel env add NEXT_PUBLIC_CONVEX_URL production
vercel env add AUTH_SECRET production
# Repeat for all required variables
```

### Step 3: Deploy to Vercel

```bash
# Production deployment via Vercel CLI
vercel --prod

# Or trigger via GitHub push to main (CI/CD pipeline)
git push origin main
```

### Step 4: Verify deployment

```bash
# Check health endpoint
curl https://your-domain.vercel.app/api/health | jq .

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2026-02-19T00:00:00.000Z",
#   "version": "abc1234",
#   "services": {
#     "convex": { "status": "ok" },
#     "auth": { "status": "ok" }
#   }
# }
```

---

## Routine Deployment

All deployments follow the same path:

1. Merge PR to `main` on GitHub
2. CI pipeline runs (lint → typecheck → build → tests → smoke tests)
3. If all checks pass, Vercel auto-deploys from `main`
4. Smoke tests run post-deploy via CI step
5. Monitor Sentry for new error spikes (first 30 minutes)

### Deployment Checklist

- [ ] All CI checks pass (GitHub Actions / Woodpecker)
- [ ] Health endpoint returns `status: ok` after deploy
- [ ] Smoke tests pass in CI
- [ ] Sentry shows no new error spikes
- [ ] Check Vercel function execution in dashboard (first deployment)

---

## Secret Rotation Procedure

Rotate secrets immediately if:
- A team member with access leaves
- You suspect a secret has been compromised
- Scheduled rotation (every 90 days recommended)

### Rotating AUTH_SECRET

1. Generate new secret: `openssl rand -base64 32`
2. Update in Vercel Dashboard → Environment Variables → `AUTH_SECRET`
3. Redeploy: `vercel --prod` or trigger CI
4. Verify: all active user sessions will be invalidated — users must log in again
5. Remove the old secret from all local `.env` files

### Rotating Convex Deploy Key

1. Go to Convex Dashboard → Settings → Deploy Keys
2. Create a new deploy key
3. Update `CONVEX_DEPLOY_KEY` in GitHub Secrets
4. Revoke the old deploy key in Convex dashboard
5. Trigger a test deployment to verify the new key works

### Rotating Sentry Auth Token

1. Go to Sentry → Organization → Auth Tokens
2. Create a new token with `project:releases` and `project:write` scopes
3. Update `SENTRY_AUTH_TOKEN` in GitHub Secrets
4. Revoke the old token

---

## Rollback Procedure

### Immediate Rollback (< 5 minutes)

Use Vercel's instant rollback:

1. Go to Vercel Dashboard → Deployments
2. Find the last known-good deployment (before the bad deploy)
3. Click the three-dot menu → "Promote to Production"
4. Verify health endpoint returns `status: ok`

Via CLI:
```bash
# List recent deployments
vercel ls

# Promote a specific deployment to production
vercel promote <deployment-url>
```

### Convex Schema Rollback

**Important**: Convex schema changes cannot be automatically reverted.
If a bad schema migration was deployed:

1. Do NOT delete tables — data loss is irreversible
2. Revert the schema change in code (add back removed fields as optional)
3. Deploy the reverted code
4. Contact Convex support for data recovery if needed

**Prevention**: Schema changes are append-only (new tables/fields only).
Never remove or rename existing fields in a single deployment.

---

## Health Monitoring

### Health Endpoint

```
GET /api/health
```

Response when healthy:
```json
{
  "status": "ok",
  "timestamp": "2026-02-19T00:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "convex": { "status": "ok" },
    "auth": { "status": "ok" }
  }
}
```

Response codes:
- `200` — healthy
- `503` — unhealthy (Convex unavailable)

### Setting Up Uptime Monitoring

Recommended: Use Better Stack, UptimeRobot, or Vercel Analytics.

Configure the monitor to:
- Check `/api/health` every 1 minute
- Alert when status is not `200` or `body.status !== "ok"`
- Alert on-call via email/Slack/PagerDuty

### Sentry Alert Thresholds (AC-3)

Configure in Sentry → Alerts → Alert Rules:

| Alert | Condition | Action |
|-------|-----------|--------|
| High Error Rate | Error rate > 1% per hour | Notify on-call |
| LCP Degradation | LCP P75 > 2500ms for 10 min | Notify team |
| Critical Error | Error count > 10 in 5 min | Page on-call |

### Performance Budget (CI)

Bundle size limits checked in CI (warn/fail thresholds):
- Warn: > 200KB per route chunk
- Fail: > 500KB per route chunk

---

## On-Call Runbook

### Issue: Health endpoint returns 503

**Symptoms**: `/api/health` returns HTTP 503 or `{"status":"unhealthy"}`

**Diagnosis**:
1. Check `services.convex.status` in health response
2. If `"unavailable"` — Convex deployment is unreachable
   - Check Convex status page: https://status.convex.dev
   - Check `NEXT_PUBLIC_CONVEX_URL` is set correctly in Vercel env
3. If `"degraded"` — a non-critical service is degraded but app is functional

**Resolution**:
- Convex outage: wait for Convex to recover, or rollback to last good deploy
- Config issue: verify env vars in Vercel dashboard, trigger redeploy

### Issue: Auth is broken — users cannot log in

**Symptoms**: Sign-in redirects fail, 401 errors in browser console

**Diagnosis**:
1. Check Sentry for `BetterAuth` errors
2. Verify `AUTH_SECRET` is set in Vercel env (redacted, but present)
3. Check `CONVEX_SITE_URL` matches the actual Convex site URL

**Resolution**:
1. If `AUTH_SECRET` was accidentally deleted: rotate it (see Secret Rotation)
2. If OAuth callback URL is wrong: update Convex site URL in env vars
3. Rollback if a recent deployment broke auth

### Issue: Sentry reports a spike in errors after deployment

**Symptoms**: Error rate jumps > 1% within 30 minutes of deployment

**Immediate Actions**:
1. Check Sentry → Issues for the most frequent new error
2. If the error is in a critical path (auth, equipment listing, health):
   - **Rollback immediately** using Vercel Deployments → Promote previous
3. If the error is in a non-critical path:
   - Create a hotfix PR targeting `main`
   - Deploy hotfix within 2 hours

### Issue: Database migration failed mid-deploy

**Symptoms**: Some Convex functions work, others return schema errors

**Diagnosis**:
1. Check Convex dashboard → Functions → Recent errors
2. Identify which function is failing and what schema field is missing

**Resolution**:
1. DO NOT manually edit the Convex database
2. Create a schema patch (add missing field as optional)
3. Deploy the patch
4. If data is corrupted, contact Convex support with the deployment ID

### Issue: Static assets returning 404

**Symptoms**: CSS/JS not loading, broken page layout, console 404 errors for `/_next/static/`

**Diagnosis**:
1. Check Vercel deployment → Build Logs for asset upload errors
2. Verify `outputDirectory` in `vercel.json` is `apps/web/.next`

**Resolution**:
1. Trigger a clean rebuild: go to Vercel → Deployments → Redeploy (clear cache)
2. If still failing, check build logs for file system errors

---

## Performance Baseline (Vietnam Region)

Target metrics for SPMET Healthcare School users (Ho Chi Minh City):

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| LCP | < 2.5s | > 2.5s (P75) |
| FID | < 100ms | > 100ms (P75) |
| CLS | < 0.1 | > 0.1 (P75) |
| TTFB | < 800ms | > 800ms (P75) |
| INP | < 200ms | > 200ms (P75) |

Vercel regions configured for lowest latency to Vietnam:
- `sin1` — Singapore (primary, ~30ms to HCMC)
- `hnd1` — Tokyo (secondary, ~50ms to HCMC)

---

*Document last updated: 2026-02-19. Maintained by SangLeTech.*
