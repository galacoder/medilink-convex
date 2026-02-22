# Generating VRT Baselines

## Current Status

| Spec File | Tests | Baselines Captured | Config Used |
|-----------|-------|--------------------|-------------|
| `visual.spec.ts` | 3 | 3 (complete) | `playwright.config.vrt.ts` |
| `auth/auth-vrt.spec.ts` | 7 | 7 (complete) | `playwright.config.vrt.ts` |
| `portal-visual.spec.ts` | 2 | 2 (complete) | `playwright.config.portal-vrt.ts` |
| `hospital/hospital-vrt.spec.ts` | 17 | **0 (missing)** | `playwright.config.portal-vrt.ts` |
| `provider/provider-vrt.spec.ts` | 14 | **0 (missing)** | `playwright.config.portal-vrt.ts` |
| `platform-admin/platform-admin-vrt.spec.ts` | 10 | **0 (missing)** | `playwright.config.portal-vrt.ts` |

**Total**: 12 existing baselines, 41 missing portal baselines (53 total when complete)

Portal specs are in Scenario B: spec files are written and valid but require running servers to
generate PNG baselines. Public VRT (auth + landing pages) is fully captured.

## Existing Baselines (12 files)

```
__snapshots__/visual.spec.ts/
  landing-page.png
  sign-in-page.png
  sign-up-page.png

__snapshots__/auth/auth-vrt.spec.ts/
  auth-sign-in.png
  auth-sign-in-mobile.png
  auth-sign-up-hospital.png
  auth-sign-up-provider.png
  auth-invite-acceptance.png
  auth-sign-in-dark.png
  auth-sign-up-dark.png        (spec has 7 tests; dark sign-up baseline not yet captured)

__snapshots__/portal-visual.spec.ts/
  hospital-dashboard.png
  provider-dashboard.png
```

## Prerequisites

1. **Convex dev server** running in a separate terminal:
   ```bash
   cd /home/sangle/dev/medilink-convex
   npx convex dev
   ```

2. **Next.js dev server** running on port 3002 (port 3000 occupied by Dokploy on homelab):
   ```bash
   cd /home/sangle/dev/medilink-convex
   PORT=3002 pnpm dev:web
   ```

3. **Auth fixtures** created by global-setup (hospital.json, provider.json, admin.json).
   These are automatically created when the portal VRT tests run for the first time.
   Required env vars for admin portal:
   - `ADMIN_SETUP_SECRET` - platform admin secret key
   - `NEXT_PUBLIC_CONVEX_SITE_URL` - Convex site URL

4. **Environment file** at `apps/web/.env.local` with valid `CONVEX_DEPLOYMENT` and `AUTH_SECRET`.

## Commands

### Generate Public Page Baselines (no auth needed)

```bash
cd apps/web
pnpm vrt:update
```

This updates baselines for `visual.spec.ts` (landing, sign-in, sign-up) and
`auth/auth-vrt.spec.ts` (7 auth page screenshots).

### Generate Portal Baselines (hospital + provider + admin)

```bash
cd apps/web
PORT=3002 pnpm vrt:portal:update
```

This runs `playwright.config.portal-vrt.ts` with `--update-snapshots` against:
- `portal-visual.spec.ts` (2 screenshots — legacy dashboard baselines)
- `hospital/hospital-vrt.spec.ts` (17 screenshots)
- `provider/provider-vrt.spec.ts` (14 screenshots)
- `platform-admin/platform-admin-vrt.spec.ts` (10 screenshots, skipped if ADMIN_SETUP_SECRET missing)

### Generate All Baselines at Once

```bash
cd apps/web
PORT=3002 pnpm vrt:all:update
```

### Run VRT Comparison (verify no regressions)

```bash
# Public pages only:
cd apps/web && pnpm vrt

# Portal pages only:
cd apps/web && PORT=3002 pnpm vrt:portal

# All:
cd apps/web && PORT=3002 pnpm vrt:all
```

## Expected Snapshot Locations

The `snapshotPathTemplate` in `playwright.config.portal-vrt.ts` is:
```
{testDir}/__snapshots__/{testFilePath}/{arg}{ext}
```

After running `vrt:portal:update`, new baselines will appear at:

```
e2e/vrt/__snapshots__/hospital/hospital-vrt.spec.ts/
  hospital-dashboard.png
  hospital-equipment-list.png
  hospital-equipment-create.png
  hospital-equipment-detail.png
  hospital-service-request-list.png
  hospital-service-request-create.png
  hospital-service-request-detail.png
  hospital-qr-scan.png
  hospital-consumables.png
  hospital-disputes.png
  hospital-settings.png
  hospital-members.png
  hospital-equipment-list-mobile.png
  hospital-dashboard-mobile.png
  hospital-service-request-list-mobile.png
  hospital-dashboard-dark.png
  hospital-equipment-list-dark.png

e2e/vrt/__snapshots__/provider/provider-vrt.spec.ts/
  provider-dashboard.png
  provider-offerings-list.png
  provider-offerings-create.png
  provider-quotes.png
  provider-services.png
  provider-analytics.png
  provider-profile.png
  provider-certifications.png
  provider-members.png
  provider-settings.png
  provider-quotes-mobile.png
  provider-dashboard-mobile.png
  provider-dashboard-dark.png
  provider-quotes-dark.png

e2e/vrt/__snapshots__/platform-admin/platform-admin-vrt.spec.ts/
  admin-dashboard.png
  admin-hospitals-list.png
  admin-hospital-detail.png
  admin-providers-list.png
  admin-provider-detail.png
  admin-service-requests.png
  admin-disputes.png
  admin-audit-log.png
  admin-analytics.png
  admin-dashboard-dark.png
```

## Notes

### Admin Portal Tests
Admin VRT tests skip gracefully when `ADMIN_SETUP_SECRET` is not set. The tests use
`test.skip()` with the message "Admin not configured — ADMIN_SETUP_SECRET not set"
rather than failing hard. This means the 10 admin tests will show as "skipped" in CI
if the env var is missing.

### Authentication Fixtures
The `globalSetup` at `e2e/global-setup.ts` creates `e2e/.auth/hospital.json`,
`e2e/.auth/provider.json`, and `e2e/.auth/admin.json` before portal VRT tests run.
These fixtures store browser cookies/localStorage for pre-authenticated sessions,
avoiding the full 3-step sign-up flow for each test.

### Port Configuration
The portal VRT config defaults to port 3000 for CI but accepts `PORT` override:
```bash
PORT=3002 pnpm vrt:portal:update   # homelab (Dokploy occupies 3000)
pnpm vrt:portal:update             # CI (uses port 3000)
```

### Animations
All VRT specs disable CSS animations/transitions via `page.addStyleTag()` before
each test to prevent animated loaders and transitions from causing pixel diffs.

### Dynamic Content Masking
Tests mask elements with `[data-testid="timestamp"]`, `[data-testid="avatar"]`, and
`time` elements to prevent dynamic content from causing false-positive failures.
See `e2e/vrt/fixtures/vrt-helpers.ts` for the `DYNAMIC_CONTENT_MASKS` constants.
