# ADR-002: Infrastructure Setup & Notification Stack

| Field       | Value                                              |
|-------------|----------------------------------------------------|
| **Date**    | 2026-02-24                                         |
| **Status**  | Accepted                                           |
| **Project** | medilink-convex (galacoder/medilink-convex)        |
| **Authors** | Sang Le                                            |

---

## Context

### Background

MediLink requires three infrastructure capabilities not addressed in ADR-001:

1. **Multi-environment isolation** — dev, staging, and production deployments of Convex with independent data, functions, and secrets
2. **External notification delivery** — email, mobile push, and SMS for healthcare-critical events beyond in-app real-time notifications
3. **Workflow automation** — durable background jobs for drip sequences, delayed reminders, and conditional follow-ups

### Current Notification State

```
✅ DONE: In-app real-time notifications (Convex native)
   - packages/db/convex/notifications.ts (328 lines)
   - apps/web/src/features/notifications/ (full UI)
   - 10 notification types, bilingual (VI/EN)
   - Real-time via Convex WebSocket subscriptions

❌ TODO: Email notifications
❌ TODO: Mobile push notifications
❌ TODO: SMS notifications (critical healthcare alerts)
❌ TODO: Funnel automation / drip sequences
```

---

## Decision

### Multi-Environment: Three Separate Convex Projects

Use separate Convex deployments for dev, staging, and production. Each environment is a complete isolated instance with its own database, functions, scheduled jobs, and file storage.

### Notification Stack

| Channel | Tool | When |
|---------|------|------|
| In-app | Convex native (existing) | All notification types |
| Email | Resend | Transactional + drip |
| Mobile push | Expo Push API | All mobile alerts |
| SMS | Twilio | Critical healthcare events only |

### Automation Orchestration: Trigger.dev

Trigger.dev handles durable background workflows — delayed execution, conditional logic, per-user event sequencing, and retry with backoff. Convex mutations publish events; Trigger.dev workflows respond.

---

## Rationale

### 1. Convex Environment Model

Convex does not use database branches. Each environment is a **separate Convex project** — a complete isolated instance. Tables are not manually created; defining `schema.ts` and deploying causes Convex to auto-create all tables.

```
Dashboard
├── Project: medilink
│   ├── production  (enchanted-chicken-xxx.convex.cloud)  ← live data
│   └── dev         (auto-created per team member)         ← your dev data
└── Project: medilink-staging  (separate free project)
    └── production  (yyy-yyy-yyy.convex.cloud)             ← staging data
```

**Cost model:**

| Environment | Convex Free Tier | Pay? |
|-------------|-----------------|------|
| Dev (per-member) | ✅ Included | Never |
| Preview (per PR) | ✅ Included, ephemeral | Never |
| Staging | ✅ Separate free project | Only if exceeding limits |
| Production | ✅ Free up to limits | Only when exceeding limits |
| Automatic backups | ❌ Pro plan required | $25/month for Pro |

### 2. Why Resend Over SendGrid/Plunk

- 50,000 emails/month free (3,000/day)
- Excellent TypeScript SDK, minimal API surface
- React Email component support for HTML templates
- Webhooks for bounce and delivery tracking
- Used by Vercel, Supabase, and Linear
- Pricing: Free → $20/month at 100K emails

### 3. Why Expo Push Over Firebase Direct

- Free (included with Expo)
- Handles FCM (Android) and APNs (iOS) in a single API call
- No separate Firebase project setup required for Expo-managed workflow
- Works identically on React Native and Expo managed workflow

### 4. Why Twilio for SMS (Critical-Only)

Healthcare platforms require SMS for high-urgency alerts (appointment reminders, lab results, prescription ready). SMS costs ~$0.01–0.02/message; using it selectively for critical events keeps cost proportional to value.

### 5. Why Trigger.dev Over Convex Crons

**Convex crons**: scheduled at fixed times (e.g., 08:00 daily), check ALL users on each run. No per-user timing, no conditional branching, no step visibility.

**Trigger.dev**: triggered by specific user events, per-user timing, conditional logic ("only if user hasn't completed X"), step-by-step dashboard visibility, retry with backoff.

Additional factor: Trigger.dev ships an **official MCP server** (`trigger dev --mcp`). Claude Code can directly list tasks, trigger runs with custom payloads, and check run logs without leaving the editor. This is a meaningful developer experience advantage over alternatives.

### 6. Tool Comparison: Trigger.dev vs Inngest vs Temporal

| Criteria | **Trigger.dev** ⭐ | Inngest | Temporal |
|----------|-------------------|---------|----------|
| Claude Code MCP | ✅ Official | ✅ Available | ❌ No |
| AI-first design | ✅ Primary principle | ✅ Strong | ❌ Enterprise-first |
| TypeScript SDK | Clean, minimal | Event-driven | Complex |
| Self-hostable | ✅ Yes | ✅ Yes | ✅ Yes (complex) |
| Free tier | 50K runs/month | 50K events/month | N/A |
| GitHub stars | 13,600 | 4,800 | 3,300 |
| Learning curve | Low | Low | High |
| Durable execution | ✅ Yes | ✅ Yes | ✅ Yes (best-in-class) |
| Best for | AI apps, integrations | Real-time streaming | Enterprise distributed |

### 7. Novu (Notification Platform) — Deferred

Novu is a notification delivery router: it routes to the right channel based on user preferences. Add it when users need to choose preferred channel, or when managing 10,000+ users with different preferences. At current scale, Trigger.dev + Resend + Expo covers all needs with less complexity.

---

## Consequences

### Positive

- **Environment isolation**: dev/staging/prod changes never affect each other; accidental staging data in production is impossible
- **Single notification codebase**: all four channels (in-app, email, push, SMS) share the same Convex event data model
- **Durable workflows**: Trigger.dev survives server restarts; delayed jobs (3 days, 7 days) are guaranteed to fire
- **Selective SMS cost**: Twilio used only for critical healthcare events keeps per-message cost proportional
- **Claude Code integration**: `trigger dev --mcp` gives AI-assisted debugging of automation workflows
- **Free staging**: separate Convex free-tier project for staging costs nothing

### Negative

- **Three Convex projects to manage**: separate deploy keys, separate environment variables, separate dashboard logins
- **Convex Pro required for production backups**: automatic daily backups need $25/month Pro plan
- **Trigger.dev adds a new external dependency**: another service to monitor; cloud free tier has 50K run/month limit
- **pushTokens schema addition**: adding this table requires a schema change and re-deploy
- **Twilio Vietnam number**: international SMS to Vietnam numbers may require additional account configuration

---

## Implementation

### Convex 3-Environment Setup

**Create staging project:**
```
1. Go to dashboard.convex.dev
2. New Project → name it "medilink-staging"
3. Copy deploy key: Settings → Deploy Keys
4. Save as CI secret: CONVEX_STAGING_DEPLOY_KEY
```

**Environment variables per environment:**
```bash
# .env.local (developer's local machine)
NEXT_PUBLIC_CONVEX_URL=https://enchanted-chicken-729.convex.cloud
CONVEX_DEPLOYMENT=dev:enchanted-chicken-729

# CI staging
NEXT_PUBLIC_CONVEX_URL=https://your-staging-deployment.convex.cloud
CONVEX_DEPLOYMENT=production:your-staging-deployment

# CI production
NEXT_PUBLIC_CONVEX_URL=https://your-production-deployment.convex.cloud
CONVEX_DEPLOYMENT=production:your-production-deployment
```

**Woodpecker CI deployment steps:**
```yaml
steps:
  - name: deploy-staging
    image: node:20
    when:
      branch: staging
    environment:
      - CONVEX_DEPLOY_KEY=from_secret:CONVEX_STAGING_DEPLOY_KEY
    commands:
      - pnpm install
      - npx convex deploy --cmd "echo staging deploy"

  - name: deploy-production
    image: node:20
    when:
      branch: main
    environment:
      - CONVEX_DEPLOY_KEY=from_secret:CONVEX_PROD_DEPLOY_KEY
    commands:
      - pnpm install
      - npx convex deploy --cmd "echo production deploy"

  - name: deploy-preview
    image: node:20
    when:
      event: pull_request
    environment:
      - CONVEX_DEPLOY_KEY=from_secret:CONVEX_PREVIEW_DEPLOY_KEY
    commands:
      - BRANCH=$(git rev-parse --abbrev-ref HEAD)
      - npx convex deploy --preview-create "$BRANCH"
```

**Backup strategy:**
- Production backups: Dashboard → Production → Backups → "Backup automatically" (requires Pro)
- Recommended: daily backups, 7-day retention, include file storage
- Manual backup before major migrations: Dashboard → Backups → "Backup Now"

### Resend Email Integration

```typescript
// packages/db/convex/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  return resend.emails.send({
    from: params.from ?? "MediLink <noreply@medilink.vn>",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
```

### Expo Push Notifications

**New schema table:**
```typescript
// Add to packages/db/convex/schema.ts
pushTokens: defineTable({
  userId: v.id("users"),
  token: v.string(),           // Expo push token
  platform: v.string(),        // "ios" | "android"
  deviceName: v.optional(v.string()),
  active: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_token", ["token"]),
```

```typescript
// packages/db/convex/lib/push.ts
export async function sendPushNotification(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify({
      to: params.token,
      title: params.title,
      body: params.body,
      data: params.data ?? {},
      sound: "default",
    }),
  });
  return response.json();
}
```

### Trigger.dev Integration Pattern

**Convex → Trigger.dev event publisher:**
```typescript
// packages/db/convex/lib/triggerdev.ts
export async function publishEvent(event: {
  name: string;
  payload: Record<string, unknown>;
}) {
  await fetch("https://api.trigger.dev/api/v1/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TRIGGER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });
}
```

**Trigger.dev task example (onboarding drip):**
```typescript
// trigger/onboarding-drip.ts
import { task, wait } from "@trigger.dev/sdk/v3";
import { sendEmail } from "../lib/email";

export const onboardingDrip = task({
  id: "onboarding-drip",
  run: async (payload: { userId: string; email: string; name: string }) => {
    // Day 0: Welcome email
    await sendEmail({
      to: payload.email,
      subject: `Welcome to MediLink, ${payload.name}!`,
      html: welcomeEmailTemplate(payload.name),
    });

    await wait.for({ days: 3 });

    // Check if profile is complete
    const profile = await fetch(
      `${process.env.CONVEX_SITE_URL}/api/user-profile?userId=${payload.userId}`
    );
    const { isComplete } = await profile.json();

    if (!isComplete) {
      await sendEmail({
        to: payload.email,
        subject: "Complete your MediLink profile to get started",
        html: profileReminderTemplate(payload.name),
      });
    }

    await wait.for({ days: 7 });

    const activity = await fetch(
      `${process.env.CONVEX_SITE_URL}/api/user-activity?userId=${payload.userId}`
    );
    const { hasFirstRequest } = await activity.json();

    if (!hasFirstRequest) {
      await sendEmail({
        to: payload.email,
        subject: "How can MediLink help your hospital?",
        html: firstRequestNudgeTemplate(payload.name),
      });
    }
  },
});
```

**Fire event from Convex mutation:**
```typescript
// packages/db/convex/users.ts
export const createUser = mutation({
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", { ...args });

    await ctx.runAction(internal.lib.triggerdev.publishEvent, {
      name: "user.registered",
      payload: { userId, email: args.email, name: args.name },
    });

    return userId;
  },
});
```

### Key Trigger.dev Tasks for MediLink

| Task ID | Trigger | Delay | Purpose |
|---------|---------|-------|---------|
| `onboarding-drip` | user.registered | 0, 3d, 7d | Welcome → profile → first request |
| `appointment-reminder` | appointment.created | -24h before | Reminder email + SMS |
| `quote-followup` | quote.sent | 48h | If no response, send reminder |
| `prescription-ready` | prescription.ready | 0 | Immediate SMS + push |
| `lab-results-ready` | lab.completed | 0 | Email + push notification |
| `inactive-user` | (weekly cron) | 7d no activity | Re-engagement email |

---

## Full Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        MediLink Stack                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────────────────────────────┐   │
│  │  Next.js Web │    │           Convex Cloud                │   │
│  │  (frontend)  │◄──►│  ┌────────────────────────────────┐  │   │
│  └──────────────┘    │  │  Database + Functions + Crons   │  │   │
│                       │  │  - notifications (in-app) ✅   │  │   │
│  ┌──────────────┐    │  │  - pushTokens (new)             │  │   │
│  │  Expo Mobile │    │  │  - automation crons (existing)  │  │   │
│  │  (future)    │    │  └────────────────┬───────────────┘  │   │
│  └──────────────┘    │                   │ publishes events  │   │
│                       └───────────────────┼──────────────────┘   │
│                                           ▼                       │
│                              ┌────────────────────────┐          │
│                              │       Trigger.dev       │          │
│                              │   (workflow/automation) │          │
│                              │  - onboarding-drip      │          │
│                              │  - appointment-reminder │          │
│                              │  - quote-followup       │          │
│                              │  - inactive-user        │          │
│                              └──────┬──────┬──────┬───┘          │
│                                     │      │      │               │
│                          ┌──────────┘  ┌───┘  ┌──┘              │
│                          ▼             ▼      ▼                   │
│                    ┌─────────┐  ┌──────────┐ ┌────────┐          │
│                    │  Resend  │  │   Expo   │ │ Twilio │          │
│                    │ (email)  │  │  (push)  │ │ (SMS)  │          │
│                    └─────────┘  └──────────┘ └────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: New Service Request Submitted

```
1. Hospital submits service request
   → Convex mutation: serviceRequests.create()

2. Mutation creates in-app notifications
   → notifications.create() for relevant providers
   [Convex native, real-time]

3. Mutation publishes event to Trigger.dev
   → "service_request.created" with requestId, hospitalId, category

4. Trigger.dev workflow "provider-notification-drip" starts:
   → Immediately: email providers via Resend
   → Immediately: push notification via Expo
   → 24h later: if no quotes received → reminder push + email to providers
   → 48h later: if still no quotes → SMS via Twilio (critical)
```

---

## Implementation Checklist

### Phase 1: Convex 3-Environment Setup
- [ ] Create `medilink-staging` project in Convex dashboard
- [ ] Add `CONVEX_STAGING_DEPLOY_KEY` to Woodpecker CI secrets
- [ ] Create `CONVEX_PROD_DEPLOY_KEY` for production
- [ ] Update `.woodpecker.yml` with multi-environment deploy steps
- [ ] Create `.env.staging` and `.env.production` template files
- [ ] Enable automatic daily backups on production (requires Pro)
- [ ] Test: push to `staging` branch → verify staging Convex deploys

### Phase 2: Resend Email Integration
- [ ] Sign up for Resend, verify domain `medilink.vn`
- [ ] Add `RESEND_API_KEY` to Convex dashboard env vars (per environment)
- [ ] Create `packages/db/convex/lib/email.ts`
- [ ] Create email templates (welcome, reminder, notification)
- [ ] Extend `packages/db/convex/notifications.ts` to call email for critical types
- [ ] Test: trigger notification → verify email arrives

### Phase 3: Expo Push Notifications
- [ ] Add `pushTokens` table to `packages/db/convex/schema.ts`
- [ ] Create `packages/db/convex/pushTokens.ts` (register, deactivate, listForUser)
- [ ] Create `packages/db/convex/lib/push.ts` — Expo Push sender
- [ ] Add push token registration to mobile app (when Expo app exists)
- [ ] Test: register token → trigger notification → verify push arrives

### Phase 4: Trigger.dev Orchestration
- [ ] Sign up for Trigger.dev Cloud (free tier)
- [ ] `pnpm add @trigger.dev/sdk` to root workspace
- [ ] Create `trigger/` directory at monorepo root
- [ ] Create `trigger/onboarding-drip.ts` — user onboarding sequence
- [ ] Create `trigger/appointment-reminder.ts`
- [ ] Create `packages/db/convex/lib/triggerdev.ts` — event publisher
- [ ] Add `TRIGGER_API_KEY` to Convex dashboard env vars
- [ ] Wire Convex mutations to publish events on key actions
- [ ] Test with MCP: `npx trigger dev --mcp` → Claude Code triggers test runs

### Phase 5: SMS (Twilio) — Critical Alerts Only
- [ ] Sign up for Twilio, get Vietnamese number or alphanumeric sender
- [ ] Create `packages/db/convex/lib/sms.ts`
- [ ] Identify critical notification types that warrant SMS
- [ ] Add SMS to Trigger.dev workflows for critical events only
- [ ] Test: trigger critical event → verify SMS received

---

## Key File Paths

```
packages/db/convex/
├── notifications.ts          ✅ EXISTS — extend for email/push
├── schema.ts                 ✅ EXISTS — add pushTokens table
├── crons.ts                  ✅ EXISTS — keep as-is for system checks
├── lib/
│   ├── email.ts              🆕 NEW — Resend client
│   ├── push.ts               🆕 NEW — Expo Push sender
│   ├── sms.ts                🆕 NEW — Twilio sender
│   └── triggerdev.ts         🆕 NEW — event publisher
└── pushTokens.ts             🆕 NEW — push token management

trigger/
├── onboarding-drip.ts        🆕 NEW — user onboarding sequence
├── appointment-reminder.ts   🆕 NEW — appointment notifications
└── quote-followup.ts         🆕 NEW — provider follow-ups

apps/web/src/features/notifications/
├── components/               ✅ EXISTS — complete UI
└── hooks/use-notifications   ✅ EXISTS — real-time hook

.woodpecker.yml               ✅ EXISTS — update for multi-env deploys
.env.example                  ✅ EXISTS — update with new env vars
```

---

## Environment Variables Master List

```bash
# Convex (per environment)
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOYMENT=dev:xxx          # or production:xxx
CONVEX_SITE_URL=https://xxx.convex.site  # for HTTP actions (Trigger.dev callbacks)

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@medilink.vn

# Push (Expo — no key needed for basic; add for higher throughput)
EXPO_ACCESS_TOKEN=xxx              # optional

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Automation (Trigger.dev)
TRIGGER_API_KEY=tr_dev_xxxxxxxxxxxx   # or tr_prod_xxx for production
TRIGGER_PROJECT_ID=proj_xxxxxxxxxxxx
```

---

## Reference

- **Convex environments documentation**: https://docs.convex.dev/production/environments
- **Convex backups**: https://docs.convex.dev/production/backup-restore
- **Resend**: https://resend.com/docs
- **Expo Push Notifications**: https://docs.expo.dev/push-notifications/overview
- **Twilio SMS**: https://www.twilio.com/docs/sms
- **Trigger.dev**: https://trigger.dev/docs
- **Trigger.dev + Claude Code**: https://github.com/triggerdotdev/claude-code-sdk-trigger-example
- **ADR-001** (pure Convex, no tRPC): `ADR-001-pure-convex-no-trpc.md`

---

*Document version: 1.0 | Based on Convex docs (Feb 2026) + community research*
