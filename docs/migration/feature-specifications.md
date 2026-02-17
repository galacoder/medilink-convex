# Multi-Project Feature Specifications

> Comprehensive feature catalog for ProX, MediLink, and PalX with user stories, acceptance criteria, and role-based organization.
> Source: 139 GitHub issues across 3 projects (ProX: 59, MediLink: 45, PalX: 35)

**Date**: 2026-02-16
**Standard**: ARCHITECTURE_STANDARD.md v2 (T3 Turbo + Convex)

---

## Table of Contents

1. [Feature Summary Matrix](#feature-summary-matrix)
2. [Consumer Features](#consumer-features) (End users)
3. [Producer Features](#producer-features) (Business admins managing the product)
4. [Admin Features](#admin-features) (Platform staff managing infrastructure)
5. [Cross-Cutting Features](#cross-cutting-features) (Shared across roles)
6. [Developer Features](#developer-features) (Infrastructure, CI, testing)

---

## Feature Summary Matrix

### ProX (59 issues -> 14 feature groups)

| # | Feature Group | Issues | Milestone | Priority |
|---|---------------|--------|-----------|----------|
| 1 | Authentication & Authorization | #40, #53, #54 | M0-M1 | Critical |
| 2 | Course Management | #1, #2, #3 | M2 | Critical |
| 3 | Membership & Billing | #5, #6 | M2 | Critical |
| 4 | User Profile | #8 | M2 | High |
| 5 | Content Management | #10, #12 | M2 | High |
| 6 | Community & Social | #22, #23, #24 | M3 | High |
| 7 | Groups & Spaces | #26, #28 | M3 | High |
| 8 | Gamification | #30, #31, #32 | M3 | Medium |
| 9 | Linchpin (Core Learning) | #33, #34 | M3 | High |
| 10 | Notifications | #4, #7 | M4 | High |
| 11 | Analytics & Reporting | #9, #11 | M4 | Medium |
| 12 | Sales Funnel | #13, #15 | M4 | Medium |
| 13 | Automation | #18, #19 | M4 | Medium |
| 14 | Infrastructure & CI/CD | #38, #39, #42, #44, #46, #55-#59 | M0-M1 | Critical |

### MediLink (45 issues -> 12 feature groups)

| # | Feature Group | Issues | Milestone | Priority |
|---|---------------|--------|-----------|----------|
| 1 | Authentication & RBAC | M0-3 | M0 | Critical |
| 2 | Equipment Management | M1-1, M1-4, M1-5 | M1 | Critical |
| 3 | Service Request Workflow | M1-2, M1-6, M1-7 | M1 | Critical |
| 4 | Provider Management | M1-3 | M1 | High |
| 5 | QR Code Scanning | M2-1 | M2 | High |
| 6 | Consumable Tracking | M2-2 | M2 | High |
| 7 | Consumer/User Management | M2-3 | M2 | Medium |
| 8 | Dispute Resolution | M2-4 | M2 | Medium |
| 9 | Notifications | M3-3, M3-4 | M3 | High |
| 10 | Automation & Workflows | M3-1, M3-2 | M3 | Critical |
| 11 | AI Assistant (Copilot) | M3-5, M3-6 | M3 | Medium |
| 12 | Analytics Dashboard | M2-7 | M2 | Medium |

### PalX (35 issues -> 8 feature groups)

| # | Feature Group | Issues | Phase | Priority |
|---|---------------|--------|-------|----------|
| 1 | Platform Separation | P1-01 to P1-04 | P1 | High |
| 2 | Plugin Infrastructure Removal | P2-01 to P2-05 | P2 | Critical |
| 3 | Billing Package | P3-01 | P3 | High |
| 4 | Profile & Identity | P3-02 | P3 | High |
| 5 | Conversation & Chat | P3-03, P4-04 to P4-06 | P3-P4 | High |
| 6 | Content & Knowledge Base | P3-05 | P3 | High |
| 7 | Connections & OAuth | P3-06, P4-07, P4-08 | P3-P4 | High |
| 8 | UI System (GlueStack -> NativeWind) | P4-01 to P4-10 | P4 | Critical |

---

## Consumer Features

Features used by end users of each product: students (ProX), hospital staff (MediLink), personal users (PalX).

---

### Feature: Course Browsing & Enrollment

**Priority**: Critical
**Projects**: ProX
**Issues**: #1, #2 (M2-1, M2-2)

**Description**: Students browse a course catalog, view course details with lessons, and enroll in courses based on their membership tier.

**User Stories**:
- As a student, I want to browse available courses by category, so that I can find relevant learning content.
- As a student, I want to view course details including lessons, instructor, and duration, so that I can decide whether to enroll.
- As a student, I want to enroll in a course, so that I can access its lessons and track my progress.
- As a student, I want to resume a course where I left off, so that I can continue learning seamlessly.

**Acceptance Criteria**:
- [ ] Course catalog page with search, filter by category, and sort options
- [ ] Course detail page showing lessons, instructor bio, estimated duration
- [ ] Enrollment button with membership tier gating (FREE courses available to all)
- [ ] Progress tracking: current lesson, completion percentage
- [ ] Real-time updates via Convex subscriptions
- [ ] Routes: `(consumer)/courses`, `(consumer)/courses/[slug]`
- [ ] Feature module at `apps/web/src/features/courses/`
- [ ] Loading skeletons and error boundaries

---

### Feature: Equipment Inventory Browsing

**Priority**: Critical
**Projects**: MediLink
**Issues**: M1-4

**Description**: Hospital users browse medical equipment inventory, view equipment details, check status and maintenance history, and report issues.

**User Stories**:
- As a hospital user, I want to browse and view equipment details, so that I can check status, maintenance history, and report issues.
- As a hospital user, I want to see real-time equipment status, so that I know which equipment is available, in maintenance, or out of service.
- As a hospital user, I want to view maintenance history on a timeline, so that I can understand equipment reliability.

**Acceptance Criteria**:
- [ ] Equipment list page with filter by category, status, and location
- [ ] Equipment detail page with status, category, specifications, and history timeline
- [ ] Components: EquipmentCard, EquipmentTable, EquipmentDetail, HistoryTimeline, StatusBadge
- [ ] Real-time updates via Convex subscriptions
- [ ] Routes: `/equipment` (list), `/equipment/[id]` (detail)
- [ ] Feature module at `apps/web/src/features/equipment/`
- [ ] Loading skeletons and error boundaries

---

### Feature: Service Request Submission & Tracking

**Priority**: Critical
**Projects**: MediLink
**Issues**: M1-6

**Description**: Hospital users submit service requests for broken or malfunctioning equipment, track request status through the workflow, compare provider quotes, and rate completed services.

**User Stories**:
- As a hospital user, I want to create service requests for equipment, so that I can get broken equipment repaired by authorized service providers.
- As a hospital user, I want to track service request status, so that I know when repairs will be completed.
- As a hospital user, I want to compare quotes from multiple providers, so that I can choose the best value.
- As a hospital user, I want to rate service after completion, so that provider quality is tracked.

**Acceptance Criteria**:
- [ ] Service request creation form linked to equipment
- [ ] Status tracking with visual workflow steps (pending -> quoted -> approved -> in_progress -> completed)
- [ ] Quote comparison view (when multiple providers quote)
- [ ] Service rating after completion (1-5 stars + comment)
- [ ] Routes: `/service-requests` (list), `/service-requests/new` (create), `/service-requests/[id]` (detail)

---

### Feature: QR Code Equipment Scanning

**Priority**: High
**Projects**: MediLink
**Issues**: M2-1

**Description**: Hospital users scan QR codes attached to equipment to instantly access equipment details, history, and submit service requests.

**User Stories**:
- As a hospital user, I want to scan QR codes on equipment, so that I can instantly access equipment details and history.
- As a hospital user, I want to jump from a QR scan directly to service request creation, so that reporting issues is fast.

**Acceptance Criteria**:
- [ ] Camera-based QR code scanning in browser
- [ ] Scan navigates directly to equipment detail page
- [ ] Feature module at `apps/web/src/features/qr-code/`
- [ ] Convex table: `qrCode` (equipmentId, code, generatedAt)

---

### Feature: Consumable Supply Tracking

**Priority**: High
**Projects**: MediLink
**Issues**: M2-2

**Description**: Hospital users track consumable supplies linked to equipment and receive low-stock alerts when reorder thresholds are reached.

**User Stories**:
- As a hospital user, I want to track consumable supplies linked to equipment, so that I know when to reorder.
- As a hospital user, I want to see low-stock alerts, so that supplies do not run out unexpectedly.

**Acceptance Criteria**:
- [ ] Consumer view of consumables linked to equipment
- [ ] Low-stock visual indicators
- [ ] Convex table: `consumable` (name, quantity, reorderLevel, equipmentId, organizationId)
- [ ] Feature module at `apps/web/src/features/consumables/`

---

### Feature: Support Ticketing

**Priority**: Medium
**Projects**: MediLink
**Issues**: M2-5

**Description**: Users submit support tickets for system issues and track their resolution.

**User Stories**:
- As a hospital user, I want to submit support tickets, so that I can get help with system issues.
- As a hospital user, I want to view my ticket history, so that I can check on pending and resolved issues.

**Acceptance Criteria**:
- [ ] Ticket creation with title, description, priority
- [ ] View my tickets with status filter
- [ ] Add comments to existing tickets
- [ ] Convex table: `supportTicket` (title, description, status, priority, userId, organizationId)

---

### Feature: Dispute Resolution

**Priority**: Medium
**Projects**: MediLink
**Issues**: M2-4

**Description**: Hospital users dispute service request outcomes when provider service quality is unsatisfactory.

**User Stories**:
- As a hospital user, I want to dispute a service request outcome, so that issues with provider service quality are resolved fairly.
- As a hospital user, I want to track dispute status, so that I know when resolution is expected.

**Acceptance Criteria**:
- [ ] Create dispute from completed service request
- [ ] Status workflow: open -> under_review -> resolved/rejected
- [ ] Convex table: `dispute` (serviceRequestId, reason, status, resolution)
- [ ] Feature module at `apps/web/src/features/disputes/`

---

### Feature: Membership & Subscription

**Priority**: Critical
**Projects**: ProX
**Issues**: #5, #6 (M2)

**Description**: Students select and manage membership tiers (FREE, STARTER, PRO, VIP) that gate access to courses, community features, and premium content.

**User Stories**:
- As a student, I want to view available membership tiers, so that I can choose the right plan for my needs.
- As a student, I want to upgrade or downgrade my membership, so that I can adjust my access level.
- As a student, I want to see what features my current tier includes, so that I understand my access rights.

**Acceptance Criteria**:
- [ ] Tier comparison page (FREE, STARTER, PRO, VIP)
- [ ] Membership status display in user profile
- [ ] Tier-gated content indicators (locked/unlocked)
- [ ] Convex schema for membership tiers and user subscriptions
- [ ] Feature module at `apps/web/src/features/membership/`

---

### Feature: User Profile

**Priority**: High
**Projects**: ProX | PalX
**Issues**: ProX #8 (M2), PalX P3-02

**Description**: Users view and edit their profile information, preferences, and activity history.

**User Stories**:
- As a student (ProX), I want to customize my profile, so that my learning identity is personalized.
- As a user (PalX), I want to manage my profile settings, so that my personal information is accurate.

**Acceptance Criteria**:
- [ ] Profile view page with avatar, name, bio
- [ ] Edit profile form with validation
- [ ] Activity summary (courses enrolled, community posts, achievements)
- [ ] Feature module at `apps/web/src/features/profile/` (ProX) or `packages/profile/` (PalX)

---

### Feature: Community & Social Interaction

**Priority**: High
**Projects**: ProX
**Issues**: #22, #23, #24 (M3)

**Description**: Students participate in community discussions, post content, interact with other learners, and build their learning network.

**User Stories**:
- As a student, I want to post in community discussions, so that I can share knowledge and ask questions.
- As a student, I want to comment on and react to posts, so that I can engage with the community.
- As a student, I want to follow other learners, so that I can build a learning network.

**Acceptance Criteria**:
- [ ] Community feed with posts, comments, and reactions
- [ ] Post creation with rich text and media
- [ ] Comment threads with nested replies
- [ ] Feature module at `apps/web/src/features/community/`
- [ ] Convex schema for posts, comments, reactions

---

### Feature: Groups & Spaces

**Priority**: High
**Projects**: ProX
**Issues**: #26, #28 (M3)

**Description**: Students join topic-based groups and spaces for focused discussions, study groups, and collaborative learning.

**User Stories**:
- As a student, I want to join groups related to my interests, so that I can engage with focused communities.
- As a student, I want to create study groups, so that I can collaborate with fellow learners.

**Acceptance Criteria**:
- [ ] Group/space listing with categories
- [ ] Group detail page with member list and posts
- [ ] Join/leave group functionality
- [ ] Group-scoped discussions
- [ ] Depends on community feature (#22)

---

### Feature: Gamification & Achievements

**Priority**: Medium
**Projects**: ProX
**Issues**: #30, #31, #32 (M3)

**Description**: Students earn badges, achievements, and points for completing courses, community participation, and learning milestones.

**User Stories**:
- As a student, I want to earn achievements for course completion, so that I feel motivated to keep learning.
- As a student, I want to see my progress on a leaderboard, so that I can compare with other learners.
- As a student, I want to view my badge collection, so that I can track my accomplishments.

**Acceptance Criteria**:
- [ ] Achievement system with badge types (course, community, streak)
- [ ] Leaderboard (weekly, monthly, all-time)
- [ ] Badge display on profile
- [ ] Progress indicators for in-progress achievements
- [ ] Feature module at `apps/web/src/features/gamification/`
- [ ] Seed data: 10+ achievement definitions

---

### Feature: AI Chatbot & Assistant

**Priority**: Medium
**Projects**: MediLink | PalX
**Issues**: MediLink M3-5, M3-6; PalX P3-03, P4-04, P4-05, P4-06

**Description**: Users interact with an AI assistant for task completion (MediLink: equipment management; PalX: personal coaching and knowledge queries).

**User Stories**:
- As a hospital user (MediLink), I want an AI copilot that can help me manage equipment, so that common tasks are faster with natural language commands.
- As a hospital user (MediLink), I want to chat with the AI assistant from any page, so that I can get help without navigating away.
- As a user (PalX), I want to have conversations with an AI assistant, so that I can get personalized guidance.
- As a user (PalX), I want chat history preserved, so that I can reference previous conversations.

**Acceptance Criteria**:
- [ ] MediLink: CopilotKit actions rewritten for Convex mutations (search equipment, create service request, check maintenance)
- [ ] MediLink: Floating chat button with drawer/panel, suggested actions, keyboard shortcut (Cmd+K)
- [ ] PalX: Chat message list with streaming support, markdown rendering
- [ ] PalX: Conversation history persistence via Convex
- [ ] MediLink: `aiConversation` Convex table
- [ ] PalX: `conversations`, `messages`, `chatbotState` Convex tables

---

### Feature: Notification Center

**Priority**: High
**Projects**: ProX | MediLink
**Issues**: ProX #4, #7 (M4); MediLink M3-3, M3-4

**Description**: Users receive in-app and email notifications for relevant events and manage their notification preferences.

**User Stories**:
- As a student (ProX), I want to receive notifications about course updates and community activity, so that I stay engaged.
- As a hospital user (MediLink), I want to receive notifications for equipment status changes and service request updates, so that I stay informed.
- As a user, I want a notification center to view and manage all notifications, so that I do not miss important updates.

**Acceptance Criteria**:
- [ ] Notification bell icon in header with unread count (real-time via Convex)
- [ ] Notification dropdown (recent 5) and full notification center page
- [ ] Mark as read (individual + all)
- [ ] Notification preferences (which types to receive)
- [ ] MediLink: Templates for equipment_status, service_request_update, maintenance_due, low_stock
- [ ] ProX: Templates for course_update, community_mention, achievement_earned

---

### Feature: Connections & OAuth Integrations

**Priority**: High
**Projects**: PalX
**Issues**: P3-06, P4-07, P4-08

**Description**: Users connect third-party accounts (Google, Apple, etc.) and manage OAuth integrations for data synchronization.

**User Stories**:
- As a user, I want to connect my third-party accounts, so that my data syncs automatically.
- As a user, I want to manage my connections and disconnect accounts, so that I control my data sharing.

**Acceptance Criteria**:
- [ ] OAuth connection flow for supported providers
- [ ] Connection card with status badge (connected/disconnected)
- [ ] Disconnect dialog with confirmation
- [ ] Convex tables: `appConnections`, `oauthCredentials`, `spending`, `habits`
- [ ] Web UI: shadcn/ui components; Native UI: NativeWind components
- [ ] Package at `packages/connections/`

---

### Feature: Content & Knowledge Base

**Priority**: High
**Projects**: ProX | PalX
**Issues**: ProX #10, #12 (M2); PalX P3-05

**Description**: Content management for learning materials (ProX) and personal knowledge bases with RAG support (PalX).

**User Stories**:
- As a student (ProX), I want to access structured content within courses, so that I can learn effectively.
- As a user (PalX), I want to build a personal knowledge base, so that my information is organized and searchable.
- As a user (PalX), I want AI-powered content curation, so that relevant content is surfaced automatically.

**Acceptance Criteria**:
- [ ] ProX: Content display within course context, media support
- [ ] PalX: Knowledge base CRUD with categories
- [ ] PalX: Convex tables: `knowledgeBase`, `userKnowledge`, `yamlFlows`, `flowTriggers`, `routerAnalytics`, `contentCurations`
- [ ] Package at `packages/content/` (PalX)
- [ ] Feature module at `apps/web/src/features/content/` (ProX)

---

### Feature: Billing & Subscription Management

**Priority**: High
**Projects**: PalX
**Issues**: P3-01

**Description**: Users manage their subscription, view usage tracking, and handle billing-related actions.

**User Stories**:
- As a user, I want to view my subscription status and usage, so that I know my plan limits.
- As a user, I want to upgrade my plan, so that I can access premium features.

**Acceptance Criteria**:
- [ ] Subscription status display
- [ ] Usage tracking (Convex table: `usageTracking`)
- [ ] Upgrade prompts when approaching limits
- [ ] Package at `packages/billing/`

---

## Producer Features

Features used by business administrators managing the product: instructors (ProX), hospital admins (MediLink).

---

### Feature: Course Administration

**Priority**: Critical
**Projects**: ProX
**Issues**: #1, #3 (M2)

**Description**: Instructors and admins create, edit, and manage courses, lessons, and content within the learning platform.

**User Stories**:
- As an instructor, I want to create and edit courses, so that I can deliver learning content to students.
- As an instructor, I want to organize course content into lessons and modules, so that the learning path is structured.
- As an admin, I want to manage all courses across the platform, so that content quality is maintained.

**Acceptance Criteria**:
- [ ] Course CRUD (create, read, update, delete/archive)
- [ ] Lesson management within courses (ordering, content editing)
- [ ] Course publishing workflow (draft -> published -> archived)
- [ ] Admin routes: `(admin)/courses`, `(admin)/courses/[id]/edit`
- [ ] Convex queries/mutations for course management
- [ ] Feature module at `apps/web/src/features/courses/`

---

### Feature: Equipment Administration

**Priority**: Critical
**Projects**: MediLink
**Issues**: M1-1, M1-5

**Description**: Hospital admins create, edit, and manage medical equipment inventory including categories, maintenance scheduling, and failure reporting.

**User Stories**:
- As a hospital admin, I want to manage medical equipment inventory, so that I can track equipment status, categories, and maintenance history.
- As a hospital admin, I want to schedule maintenance, so that equipment is serviced proactively.
- As a hospital admin, I want to manage equipment categories, so that inventory is well organized.

**Acceptance Criteria**:
- [ ] Equipment CRUD operations (create, edit, delete)
- [ ] Category management (create, edit categories)
- [ ] Maintenance scheduling with calendar view
- [ ] Convex tables: `equipment`, `equipmentCategory`, `equipmentHistory`, `maintenanceRecord`, `failureReport`
- [ ] Queries: `list`, `getById`, `getByCategory`, `getHistory`, `getMaintenanceSchedule`
- [ ] Mutations: `create`, `update`, `updateStatus`, `addHistoryEntry`, `scheduleMaintenance`, `reportFailure`
- [ ] Organization-scoped (all queries filter by `organizationId`)
- [ ] Routes: `/admin/equipment`, `/admin/equipment/categories`

---

### Feature: Service Request Administration

**Priority**: Critical
**Projects**: MediLink
**Issues**: M1-2, M1-7

**Description**: Hospital admins manage the full service request lifecycle: triage, provider assignment, quote approval, and completion verification.

**User Stories**:
- As an admin, I want to manage service requests and assign providers, so that equipment service is handled efficiently.
- As an admin, I want to approve or reject provider quotes, so that cost is controlled.
- As an admin, I want to see a service request dashboard, so that I can prioritize work.

**Acceptance Criteria**:
- [ ] Service request dashboard with filter/sort (status, priority, date)
- [ ] Provider assignment workflow
- [ ] Quote approval/rejection with audit trail
- [ ] Convex tables: `serviceRequest`, `serviceQuote`, `serviceRating`, `serviceRequestHistory`
- [ ] Status workflow: pending -> quoted -> approved -> in_progress -> completed
- [ ] Routes: `/admin/service-requests`, `/admin/providers`

---

### Feature: Provider Management

**Priority**: High
**Projects**: MediLink
**Issues**: M1-3

**Description**: Admins manage service providers including their specialties, service areas, and availability status.

**User Stories**:
- As an admin, I want to manage service providers, so that hospitals can request service from authorized providers.
- As an admin, I want to track provider performance via ratings, so that I can maintain service quality.

**Acceptance Criteria**:
- [ ] Provider CRUD (name, contact, specialty, status, organizationId)
- [ ] Provider listing with specialty filter
- [ ] Provider detail with service history and average rating
- [ ] Convex table: `provider`
- [ ] Linked to service requests via `providerId`

---

### Feature: Consumer/User Management

**Priority**: Medium
**Projects**: MediLink
**Issues**: M2-3

**Description**: Admins manage hospital users within their organization, including invitations, role assignment, and access control.

**User Stories**:
- As an admin, I want to manage hospital users within my organization, so that I can control access and monitor usage.
- As an admin, I want to invite new users by email, so that onboarding is streamlined.

**Acceptance Criteria**:
- [ ] Admin route: `/admin/users` (list, invite, deactivate)
- [ ] Invite user by email (within organization)
- [ ] Role assignment (student, instructor, admin)
- [ ] User activity overview
- [ ] Feature module at `apps/web/src/features/consumer-mgmt/`

---

### Feature: Automation & Recipe Builder

**Priority**: Critical
**Projects**: MediLink
**Issues**: M3-1, M3-2

**Description**: Admins create automated workflows (recipes) triggered by system events, replacing the legacy EventEmitter3 event bus with Convex scheduled functions.

**User Stories**:
- As an admin, I want automated workflows triggered by system events, so that repetitive tasks happen automatically (maintenance reminders, status escalations).
- As an admin, I want to build automation recipes visually, so that I can create workflows without coding.
- As an admin, I want to view automation execution logs, so that I can debug and monitor workflows.

**Acceptance Criteria**:
- [ ] Convex tables: `automationRecipe`, `automationExecution`
- [ ] Replace EventEmitter3 with Convex scheduled functions
- [ ] Triggers: `equipment_status_changed`, `service_request_created`, `maintenance_due`, `low_stock`
- [ ] Actions: `send_notification`, `update_status`, `create_audit_log`
- [ ] Visual recipe builder UI: select trigger, add conditions, configure actions
- [ ] Activation/deactivation toggle
- [ ] Execution log viewer (recent runs, success/failure)
- [ ] Convex crons for periodic checks
- [ ] Routes: `/admin/automation`, `/admin/automation/new`

---

### Feature: Sales Funnel Management

**Priority**: Medium
**Projects**: ProX
**Issues**: #13, #15 (M4)

**Description**: Admins configure and manage sales funnels for course and membership promotion, tracking conversion metrics.

**User Stories**:
- As an admin, I want to set up sales funnels for courses, so that I can optimize enrollment conversion.
- As an admin, I want to track funnel performance metrics, so that I can improve marketing effectiveness.

**Acceptance Criteria**:
- [ ] Funnel configuration (landing page, offer, checkout)
- [ ] Conversion tracking metrics
- [ ] Feature module at `apps/web/src/features/sales-funnel/`

---

### Feature: Automation (ProX)

**Priority**: Medium
**Projects**: ProX
**Issues**: #18, #19 (M4)

**Description**: Platform admins configure automated actions triggered by user events (enrollment, completion, membership changes).

**User Stories**:
- As an admin, I want to automate email sequences triggered by enrollment, so that student onboarding is consistent.
- As an admin, I want to set up automated notifications for course milestones, so that students stay engaged.

**Acceptance Criteria**:
- [ ] Automation rule configuration (trigger, condition, action)
- [ ] Integration with notification system
- [ ] Feature module at `apps/web/src/features/automation/`

---

## Admin Features

Features for platform-level administration: system configuration, monitoring, audit, and analytics.

---

### Feature: Analytics Dashboard

**Priority**: Medium
**Projects**: ProX | MediLink
**Issues**: ProX #9, #11 (M4); MediLink M2-7

**Description**: Admins view analytics dashboards with key metrics, charts, and trend data for their platform.

**User Stories**:
- As a ProX admin, I want to see enrollment metrics, revenue data, and engagement analytics, so that I can make data-driven decisions.
- As a MediLink admin, I want to see equipment utilization, service request volume, and provider ratings, so that I can monitor operational health.

**Acceptance Criteria**:
- [ ] ProX: Enrollment counts, revenue trends, course completion rates, community engagement metrics
- [ ] MediLink: Equipment count by status, service request volume over time, provider average ratings
- [ ] Charts using Recharts or similar lightweight library
- [ ] Real-time updates via Convex subscriptions
- [ ] MediLink: Feature module at `apps/web/src/features/analytics/`; route `/admin/analytics`
- [ ] MediLink: Convex table: `analyticsEvent` (optional event tracking)

---

### Feature: Audit Log

**Priority**: Medium
**Projects**: MediLink
**Issues**: M2-6, M4-2

**Description**: System-wide audit trail that logs all data-changing actions for compliance and accountability.

**User Stories**:
- As an admin, I want to view an audit trail of system actions, so that I can track who did what and when.
- As an admin, I want every data-changing action logged, so that the audit trail is comprehensive.

**Acceptance Criteria**:
- [ ] Convex table: `auditLog` (action, userId, entityType, entityId, metadata, timestamp)
- [ ] Admin route: `/admin/audit-log` with filterable list
- [ ] Automatic logging from mutations (Convex middleware pattern)
- [ ] All create/update/delete mutations across all features log to `auditLog`
- [ ] Log entries include: userId, action, entityType, entityId, before/after state
- [ ] Feature module at `apps/web/src/features/audit-log/`

---

### Feature: Payment Integration (Stub)

**Priority**: Low
**Projects**: MediLink
**Issues**: M2-8

**Description**: Payment schema and stub functions for future Stripe integration.

**User Stories**:
- As a developer, I want the payment schema in place, so that Stripe can be integrated when ready.

**Acceptance Criteria**:
- [ ] Convex table: `payment` (amount, currency, status, userId, serviceRequestId)
- [ ] Stub mutations: `createPayment`, `updatePaymentStatus`
- [ ] No Stripe integration yet (deferred to post-migration)

---

## Cross-Cutting Features

Features that span multiple roles and are foundational to all products.

---

### Feature: Authentication & Authorization

**Priority**: Critical
**Projects**: ProX | MediLink | PalX
**Issues**: ProX #40, #53, #54; MediLink M0-3; PalX (existing, restructuring only)

**Description**: User authentication (sign up, sign in, sign out) with role-based access control and organization-scoped permissions using Better Auth + Convex adapter.

**User Stories**:
- As a user, I want to sign up with email/password, so that I can access the platform.
- As a user, I want to sign in securely, so that my account and data are protected.
- As a hospital user (MediLink), I want organization-scoped access, so that I only see data from my hospital.
- As an admin, I want to assign roles to users, so that access is controlled appropriately.

**Acceptance Criteria**:
- [ ] Sign up with email/password
- [ ] Sign in with session persistence
- [ ] Sign out with session destruction
- [ ] Protected routes redirect to sign-in when unauthenticated
- [ ] Role-based access: `student`, `instructor`, `admin`, `superadmin`
- [ ] Organization-scoped auth (user belongs to organization)
- [ ] Better Auth + Convex adapter (PalX pattern validated)
- [ ] Convex auth tables: `user`, `session`, `account`, `verification`
- [ ] `user.organizationId` field for multi-tenancy readiness

---

### Feature: Multi-Tenancy Foundation

**Priority**: High
**Projects**: ProX | MediLink
**Issues**: ProX #53 (M1-1); MediLink M0-2

**Description**: Organization-level data isolation with `organizationId` field on all domain entities, preparing for future multi-tenant SaaS functionality.

**User Stories**:
- As a platform owner, I want data isolated by organization, so that different organizations cannot access each other's data.
- As a user, I want to see only my organization's data, so that the interface is relevant and secure.

**Acceptance Criteria**:
- [ ] `organization` table with slug, plan, ownerId fields
- [ ] `user.organizationId` field (optional, null = default org)
- [ ] All domain queries filter by `organizationId`
- [ ] Indexes: `organization.by_slug`, `organization.by_owner`
- [ ] Phase 1 only: single-tenant with field ready (no subdomain routing in M0-M5)

---

### Feature: Base UI Layout & Navigation

**Priority**: High
**Projects**: ProX | MediLink
**Issues**: ProX #46 (M0-6); MediLink M0-6

**Description**: Shared application shell with header, sidebar navigation, mobile-responsive layout, and route group structure for consumer and admin views.

**User Stories**:
- As a user, I want clear navigation, so that I can find features quickly.
- As a mobile user, I want a responsive layout, so that the app works well on all devices.

**Acceptance Criteria**:
- [ ] Route groups: `(auth)/`, `(consumer)/`, `(admin)/`
- [ ] Header with navigation, user avatar dropdown
- [ ] Sidebar navigation for consumer and admin contexts
- [ ] Mobile navigation (Sheet-based)
- [ ] Theme toggle (dark/light)
- [ ] 15+ shadcn/ui components installed

---

### Feature: Notifications Integration

**Priority**: High
**Projects**: MediLink
**Issues**: M4-1

**Description**: Cross-feature notification integration ensuring all system events trigger appropriate notifications to relevant users.

**User Stories**:
- As a hospital user, I want to receive notifications from all system events, so that I am informed regardless of which feature triggers the event.

**Acceptance Criteria**:
- [ ] Equipment status change triggers notification to assigned users
- [ ] Service request status change triggers notification to requester + admin
- [ ] Low stock alert triggers notification to admin
- [ ] Maintenance due triggers notification to equipment manager
- [ ] All notifications appear in notification center (real-time)

---

## Developer Features

Infrastructure, CI/CD, testing, and developer tooling features.

---

### Feature: Repository Scaffold & Monorepo Setup

**Priority**: Critical
**Projects**: ProX | MediLink | PalX
**Issues**: ProX #38, #39 (M0); MediLink M0-1, M0-2, M0-5; PalX P1-01 to P1-04

**Description**: T3 Turbo monorepo scaffold with Convex backend, Turborepo build system, and pnpm workspace configuration.

**User Stories**:
- As a developer, I want a clean T3 Turbo monorepo scaffold, so that I have a working foundation for development.
- As a developer (PalX), I want the web app directory renamed to `apps/web/`, so that the codebase follows the architecture standard.

**Acceptance Criteria**:
- [ ] `pnpm install` succeeds with no errors
- [ ] `pnpm dev` starts Next.js on localhost:3000
- [ ] `pnpm build` produces clean production build
- [ ] Convex dev server starts with `npx convex dev`
- [ ] Package scope matches project (`@prox/*`, `@medilink/*`, `@palx/*`)
- [ ] Package count: ~9 (5 core + 4 tooling) for new projects

---

### Feature: CI/CD Pipeline (6-Stage)

**Priority**: Critical
**Projects**: ProX | MediLink | PalX
**Issues**: ProX #42, #44 (M0); MediLink M0-4; PalX P5-01

**Description**: Woodpecker CI pipeline with 6 stages: lint, typecheck, unit test, E2E test, VRT, deploy.

**User Stories**:
- As a developer, I want automated CI on every PR, so that code quality is enforced without human review.
- As a developer, I want fast builds with remote caching, so that feedback loops are short.

**Acceptance Criteria**:
- [ ] Woodpecker CI triggers on PR to main
- [ ] All 6 stages defined in `.woodpecker.yml`
- [ ] Turborepo remote cache connected
- [ ] Pipeline completes in under 5 minutes (scaffold)
- [ ] Preview deployments on every PR (Vercel)

---

### Feature: Seed Data

**Priority**: Medium
**Projects**: ProX | MediLink
**Issues**: ProX #58 (M1-6); MediLink M1-8

**Description**: Comprehensive seed data scripts for development and testing with realistic sample data.

**User Stories**:
- As a developer, I want sample data loaded, so that I can develop and test features against realistic data.

**Acceptance Criteria**:
- [ ] ProX: 4 tiers, 10+ courses, 20+ users, 5+ community spaces, 10+ achievements
- [ ] MediLink: 2 organizations, 5 users/org, 20 equipment items, 5 providers, 10 service requests
- [ ] Script runs via `npx convex run seed:all`
- [ ] Uses Convex format (TypeScript)

---

### Feature: E2E Test Suite

**Priority**: High
**Projects**: ProX | MediLink
**Issues**: ProX #14, #16, #17, #35, #36, #37 (M2-M3); MediLink M1-9, M2-9, M3-7, M4-5

**Description**: Comprehensive end-to-end test coverage using Playwright for all critical user journeys.

**User Stories**:
- As a developer, I want automated E2E tests, so that core workflows are validated on every PR.

**Acceptance Criteria**:
- [ ] ProX target: 20-40 E2E tests
- [ ] MediLink target: 20-30 E2E tests
- [ ] Auth flow (sign up, sign in, sign out, role-based access)
- [ ] Core workflows (ProX: enrollment + course access; MediLink: equipment + service requests)
- [ ] All tests pass in CI (Stage 4)

---

### Feature: Visual Regression Testing (VRT)

**Priority**: Medium
**Projects**: ProX | MediLink
**Issues**: ProX #43, #45 (M5); MediLink M2-10, M4-6

**Description**: Visual regression testing with screenshot baselines to catch unintended UI changes.

**User Stories**:
- As a developer, I want visual regression baselines, so that UI changes are caught automatically.

**Acceptance Criteria**:
- [ ] ProX target: 50-80 VRT screenshots
- [ ] MediLink target: 30-50 VRT screenshots
- [ ] Dark + light mode variants
- [ ] Mobile viewport variants
- [ ] Baselines approved and stored
- [ ] VRT passes in CI (Stage 5)

---

### Feature: Plugin Infrastructure Removal

**Priority**: Critical
**Projects**: PalX
**Issues**: P2-01 to P2-05

**Description**: Remove all plugin infrastructure (5 core packages: plugin-loader, extension-registry, hook-registry, event-bus, plugin-config) and replace with static imports.

**User Stories**:
- As a developer, I want the app to use static imports instead of dynamic plugin discovery, so that the app loads faster and the code is simpler.
- As a developer, I want WordPress-style extension points removed, so that the codebase uses direct imports per T3 standard.

**Acceptance Criteria**:
- [ ] `PluginProvider` removed from `layout.tsx`
- [ ] `packages/core/` directory fully deleted (5 packages)
- [ ] `pluginConfig` table removed from `convex/schema.ts`
- [ ] All features previously loaded via PluginProvider now use static imports
- [ ] No remaining imports of `@palx/plugin-loader`, `@palx/extension-registry`, `@palx/hook-registry`, `@palx/event-bus`, `@palx/plugin-config`
- [ ] `pnpm install && pnpm build` succeeds

---

### Feature: GlueStack UI Replacement

**Priority**: Critical
**Projects**: PalX
**Issues**: P4-01 to P4-10

**Description**: Replace GlueStack UI (54 files) with platform-specific UI: shadcn/ui for web, NativeWind + React Native Reusables for native, with shared design tokens.

**User Stories**:
- As a developer, I want a shared design token package, so that web and native apps use the same colors, spacing, and typography.
- As a developer, I want the shared UI package to be web-only with shadcn/ui, so that it has no React Native or GlueStack dependencies.
- As a developer, I want a dedicated native UI package using NativeWind, so that mobile components follow the architecture standard.

**Acceptance Criteria**:
- [ ] `packages/design-tokens/` created with shared Tailwind theme
- [ ] `packages/ui/` refactored to web-only shadcn/ui (no GlueStack, no React Native)
- [ ] `packages/ui-native/` created with NativeWind + React Native Reusables
- [ ] All chat components rebuilt (MessageList, StreamingMessage, YAMLFlowMessage, UpgradePrompt, HistorySheet) for both web and native
- [ ] All connection components rebuilt (ConnectionCard, StatusBadge, DisconnectDialog) for both web and native
- [ ] `packages/ui-gluestack/` deleted entirely
- [ ] `GlueStackProvider` removed from both web and Expo layouts
- [ ] No remaining `@gluestack-ui/*` or `@palx/ui-gluestack` imports
- [ ] Both web and Expo apps build without errors

---

### Feature: Plugin-to-Package Migration

**Priority**: High
**Projects**: PalX
**Issues**: P3-01 to P3-11

**Description**: Migrate 10 plugins from `packages/plugins/` to their target locations: 6 to standard packages, 1 to Expo features, 2 deleted (replaced in Phase 4), 1 to dev utils.

**User Stories**:
- As a developer, I want billing, profile, conversation, notifications, content, and connections logic in standard packages, so that they work without the plugin system.
- As a developer, I want the mobile dashboard as an Expo feature module, so that mobile-specific UI lives in the mobile app.
- As a developer, I want the plugins directory completely removed, so that there is no residual plugin structure.

**Acceptance Criteria**:
- [ ] 6 shared packages created: `@palx/billing`, `@palx/profile`, `@palx/conversation`, `@palx/notifications`, `@palx/content`, `@palx/connections`
- [ ] `apps/expo/src/features/dashboard/` created from dashboard-mobile plugin
- [ ] `packages/testing/` created from testing plugin
- [ ] `packages/plugins/ui-web/` and `packages/plugins/ui-mobile/` deleted (replaced in Phase 4)
- [ ] `packages/plugins/` directory fully deleted
- [ ] All plugin manifests deleted
- [ ] No remaining `@palx/plugin-*` imports anywhere in codebase
- [ ] `pnpm install && pnpm build` succeeds

---

### Feature: Data Migration (Postgres to Convex)

**Priority**: Critical
**Projects**: MediLink
**Issues**: M4-3, M4-4, M5-4

**Description**: Migrate production data from Postgres (Drizzle ORM) to Convex, preserving all operational data with proper type conversions and ID mapping.

**User Stories**:
- As a developer, I want to migrate existing production data, so that no data is lost during the transition.
- As an admin, I want all production data migrated to the new system, so that hospitals can continue operations without data loss.

**Acceptance Criteria**:
- [ ] Script reads from Postgres (Drizzle connection) and writes to Convex (bulk import API)
- [ ] Core data: organizations, users, equipment (all 5 tables), providers
- [ ] Operational data: service requests (4 tables), consumables, disputes, support tickets, audit logs
- [ ] Type conversions: timestamps to Unix ms, enums to Convex unions, FKs to `v.id()`
- [ ] ID mapping table preserved (old Postgres IDs -> new Convex IDs)
- [ ] Idempotent (safe to re-run), dry-run mode for validation
- [ ] Row count verification (source vs destination)
- [ ] Spot-check 10 records per table

---

### Feature: Performance Optimization

**Priority**: High
**Projects**: ProX | MediLink
**Issues**: ProX #47 (M5); MediLink M5-1

**Description**: Optimize application performance to meet Lighthouse targets.

**User Stories**:
- As a user, I want the application to load quickly, so that I can access features without delay.

**Acceptance Criteria**:
- [ ] Bundle size < 200KB (first load JS)
- [ ] LCP < 1.5s on main dashboard
- [ ] CLS < 0.1
- [ ] Lighthouse Performance > 90

---

### Feature: Security Audit

**Priority**: Critical
**Projects**: ProX | MediLink
**Issues**: ProX #48 (M5); MediLink M5-2

**Description**: Comprehensive security audit covering auth, input validation, data isolation, and vulnerability scanning.

**User Stories**:
- As an admin, I want the application to be secure, so that user data and business data are protected.
- As a MediLink admin, I want organization data isolation verified, so that patient-adjacent medical equipment data is secure.

**Acceptance Criteria**:
- [ ] Organization isolation verified (cross-org data access impossible)
- [ ] Auth routes protected (no unauthenticated data access)
- [ ] Input validation on all mutations (Zod + Convex validators)
- [ ] No env var leakage in client bundle
- [ ] Rate limiting on auth endpoints
- [ ] Zero critical vulnerabilities

---

### Feature: Accessibility Audit

**Priority**: High
**Projects**: ProX | MediLink
**Issues**: ProX #49 (M5); MediLink M5-3

**Description**: WCAG 2.1 AA compliance audit ensuring the application is usable by people with accessibility needs.

**User Stories**:
- As a user with accessibility needs, I want the application to be fully usable, so that I can access all features regardless of ability.

**Acceptance Criteria**:
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader compatibility (ARIA labels)
- [ ] Sufficient color contrast
- [ ] Lighthouse Accessibility > 90

---

### Feature: Production Deployment & Monitoring

**Priority**: Critical
**Projects**: ProX | MediLink
**Issues**: ProX #50, #51, #52 (M5); MediLink M5-5, M5-6, M5-7

**Description**: Production deployment to Vercel + Convex Cloud with monitoring, error tracking, and smoke testing.

**User Stories**:
- As a developer, I want the application deployed to production with monitoring, so that issues are detected and resolved quickly.
- As a developer, I want a verified production deployment, so that users can be onboarded with confidence.

**Acceptance Criteria**:
- [ ] Vercel production deployment configured with custom domain
- [ ] Convex production deployment configured
- [ ] SSL certificate active
- [ ] Sentry configured for error tracking
- [ ] Vercel Analytics + Speed Insights enabled
- [ ] Smoke test: all routes load, auth works, core workflows functional
- [ ] Git tagged as `v1.0.0`

---

### Feature: Documentation Update

**Priority**: Medium
**Projects**: PalX
**Issues**: P1-04, P5-02, P5-03

**Description**: Update CLAUDE.md, architecture diagrams, and all documentation to reflect the restructured architecture. Remove deprecated plugin and GlueStack documentation.

**User Stories**:
- As a developer or AI agent, I want documentation to accurately describe the new architecture, so that development guidance is correct.

**Acceptance Criteria**:
- [ ] CLAUDE.md architecture diagram updated (no `packages/plugins/`, no `packages/core/`)
- [ ] Plugin table replaced with packages table
- [ ] `docs/PLUGIN_GUIDE.md` deleted or archived
- [ ] GlueStack and plugin standard docs deprecated
- [ ] All path references updated to `apps/web/` (not `apps/nextjs/`)
- [ ] No documentation references GlueStack or plugin manifests

---

## Appendix A: Issue Count Reconciliation

| Project | Source Issues | Feature Groups | Coverage |
|---------|-------------|----------------|----------|
| ProX | 59 | 14 | 100% (all milestones M0-M5) |
| MediLink | 45 | 12 | 100% (all milestones M0-M5) |
| PalX | 35 | 8 | 100% (all phases P1-P5) |
| **Total** | **139** | **34** | **100%** |

### ProX Issue-to-Feature Mapping

| Feature Group | Issues |
|---------------|--------|
| Auth & Authorization | #40, #53, #54 |
| Course Management | #1, #2, #3 |
| Membership & Billing | #5, #6 |
| User Profile | #8 |
| Content Management | #10, #12 |
| Community & Social | #22, #23, #24 |
| Groups & Spaces | #26, #28 |
| Gamification | #30, #31, #32 |
| Linchpin (Core Learning) | #33, #34 |
| Notifications | #4, #7 |
| Analytics & Reporting | #9, #11 |
| Sales Funnel | #13, #15 |
| Automation | #18, #19 |
| Infrastructure & CI/CD | #38, #39, #42, #44, #46, #55, #56, #57, #58, #59 |
| E2E & VRT Testing | #14, #16, #17, #35, #36, #37, #41, #43, #45, #47, #48, #49, #50, #51, #52 |
| M4 Additional | #20, #21, #25, #27, #29 |

### MediLink Issue-to-Feature Mapping

| Feature Group | Issues |
|---------------|--------|
| Auth & RBAC | M0-3 |
| Equipment Management | M1-1, M1-4, M1-5 |
| Service Requests | M1-2, M1-6, M1-7 |
| Provider Management | M1-3 |
| QR Code | M2-1 |
| Consumables | M2-2 |
| Consumer Management | M2-3 |
| Disputes | M2-4 |
| Support | M2-5 |
| Audit Log | M2-6, M4-2 |
| Analytics | M2-7 |
| Payment (stub) | M2-8 |
| Automation | M3-1, M3-2 |
| Notifications | M3-3, M3-4, M4-1 |
| AI Assistant | M3-5, M3-6 |
| Seed Data | M1-8 |
| E2E Testing | M1-9, M2-9, M3-7, M4-5 |
| VRT | M2-10, M4-6 |
| Data Migration | M4-3, M4-4, M5-4 |
| Performance | M5-1 |
| Security | M5-2 |
| Accessibility | M5-3 |
| Deployment | M5-5, M5-6, M5-7 |
| Infrastructure | M0-1, M0-2, M0-4, M0-5, M0-6 |

### PalX Issue-to-Feature Mapping

| Feature Group | Issues |
|---------------|--------|
| Platform Separation | P1-01, P1-02, P1-03, P1-04 |
| Plugin Infrastructure Removal | P2-01, P2-02, P2-03, P2-04, P2-05 |
| Plugin-to-Package Migration | P3-01 to P3-11 |
| GlueStack Replacement | P4-01 to P4-10 |
| CI + Documentation Cleanup | P5-01 to P5-05 |

---

## Appendix B: Shared Feature Patterns Across Projects

Features that appear in multiple projects with similar implementation patterns:

| Pattern | ProX | MediLink | PalX |
|---------|------|----------|------|
| Authentication (Better Auth + Convex) | M0-M1 | M0 | Existing |
| Multi-tenancy (`organizationId`) | M1 | M0 | N/A (single-user) |
| Route groups (`(consumer)/`, `(admin)/`) | M0 | M0 | Existing |
| Feature module pattern (`features/`) | M2+ | M1+ | P3 (from plugins) |
| Convex schema + functions | M1+ | M1+ | Existing |
| Notification system | M4 | M3 | P3 (from plugin) |
| E2E testing (Playwright) | M2-M5 | M1-M4 | P5 |
| VRT baselines | M5 | M2, M4 | P5 |
| CI/CD (Woodpecker 6-stage) | M0 | M0 | P5 |
| Performance + Security + A11y audit | M5 | M5 | P5 |
| Production deployment (Vercel + Convex) | M5 | M5 | Existing |

---

*Generated from: ProX prox-issues-verification.md (59 issues), MediLink medilink-migration-roadmap.md (45 issues), PalX palx-restructuring-roadmap.md (35 issues)*
