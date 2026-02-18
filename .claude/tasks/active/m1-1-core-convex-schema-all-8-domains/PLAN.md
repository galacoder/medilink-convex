# PLAN.md -- M1-1: Core Convex Schema

## Overview

**Objective**: Define all 8 MIGRATE plugin domain tables in `convex/schema.ts` with bilingual Zod validators and Vitest test suites.

**Scope**: 20 new Convex tables, 5 new validator files, 5 new test files, 1 updated barrel export.

**Approach**: TDD-first -- write validator tests alongside validators in each wave, schema tables tested indirectly via `npx convex typecheck` in Wave 4.

## Wave Strategy

| Wave | Domains | New Tables | Validator Files | Test Files | Model | Est. Minutes |
|------|---------|-----------|-----------------|------------|-------|-------------|
| 1 | Equipment + QR | 7 | 1 | 1 | sonnet | 35 |
| 2 | Service Requests + Providers | 7 | 2 | 2 | sonnet | 35 |
| 3 | Consumables + Disputes + Audit | 6 | 2 | 2 | sonnet | 30 |
| 4 | Verification + Exports | 0 | 0 | 0 | haiku | 10 |
| **Total** | **8 domains** | **20** | **5** | **5** | | **110 min** |

### Why this grouping?

1. **Wave 1 (Equipment + QR)**: Equipment is the foundational domain. Every other domain (service-requests, qr-code, consumables) references equipment via v.id("equipment"). QR is tiny (2 tables) and directly coupled to equipment. Must go first.

2. **Wave 2 (Service Requests + Providers)**: These domains have bidirectional relationship -- providers submit quotes for service requests, service requests get assigned to providers. Defining together ensures FK consistency. Both reference equipment from Wave 1.

3. **Wave 3 (Consumables + Disputes + Audit)**: Leaf domains with fewest inbound dependencies. Consumables references equipment (Wave 1). Disputes references serviceRequests (Wave 2). AuditLog is standalone. Grouping three smaller domains avoids a wave with too few tasks.

4. **Wave 4 (Verification)**: Mechanical exports and type verification. Uses haiku model since no complex logic. Catches any FK or type issues before marking task complete.

## Multi-Tenancy Enforcement

Every new table (except junction/history tables that inherit org scope via parent FK) MUST include:

```typescript
organizationId: v.id("organizations"),
```

With index:

```typescript
.index("by_org", ["organizationId"])
```

Tables that inherit org scope via parent FK chain (no direct organizationId needed):
- equipmentHistory (via equipment -> organization)
- maintenanceRecords (via equipment -> organization)
- failureReports (via equipment -> organization)
- qrScanLog (via equipment -> organization)
- quotes (via serviceRequests -> organization)
- serviceRatings (via serviceRequests -> organization)
- consumableUsageLog (via consumables -> organization)
- disputeMessages (via disputes -> organization)

**Decision**: Include organizationId on ALL domain root tables even if inferable, for query performance (avoid joins). History/message sub-tables reference parent ID directly.

## Bilingual Naming Convention

### Enum Definitions in Schema

Convex enums use English-only values (machine identifiers):

```typescript
// Schema: English-only enum values
status: v.union(v.literal("operational"), v.literal("maintenance"))
```

### Validator Bilingual Messages

Validators contain Vietnamese + English:

```typescript
// Validator: "Vietnamese / English" format
name: z.string().min(2, "Ten phai co it nhat 2 ky tu / Name must be at least 2 characters")
```

### UI Display Labels (Not in scope)

Display labels for enum values (e.g., "Dang hoat dong" / "Operational") are UI-layer concern, defined in `src/lib/i18n/labels.ts` in a future task.

## Index Strategy

### Standard Indexes (every domain root table)

```typescript
.index("by_org", ["organizationId"])
```

### Domain-Specific Indexes

**Equipment domain:**
- equipment: by_org, by_status, by_category, by_org_and_serialNumber (compound)
- equipmentHistory: by_equipment, by_user
- maintenanceRecords: by_equipment, by_status, by_scheduledDate
- failureReports: by_equipment, by_status, by_urgency

**Service Requests domain:**
- serviceRequests: by_org, by_status, by_equipment, by_requester
- quotes: by_request, by_provider, by_status
- serviceRatings: by_request, by_provider

**Providers domain:**
- providers: by_org, by_status, by_verificationStatus
- serviceOfferings: by_provider
- certifications: by_provider
- coverageAreas: by_provider

**Consumables domain:**
- consumables: by_org, by_categoryType, by_org_and_sku (compound)
- consumableUsageLog: by_consumable, by_user, by_createdAt
- reorderRequests: by_org, by_status, by_consumable

**Disputes domain:**
- disputes: by_org, by_status, by_serviceRequest
- disputeMessages: by_dispute

**Audit Log domain:**
- auditLog: by_org, by_user, by_entityType, by_createdAt

## Schema File Organization

The `convex/schema.ts` file will be organized with clear section comments:

```typescript
// ============================================================
// Base Tables (existing: organizations, organizationMemberships, users)
// ============================================================

// ============================================================
// Equipment Domain (5 tables)
// ============================================================

// ============================================================
// QR Code Domain (2 tables)
// ============================================================

// ============================================================
// Service Requests Domain (3 tables)
// ============================================================

// ============================================================
// Providers Domain (4 tables)
// ============================================================

// ============================================================
// Consumables Domain (3 tables)
// ============================================================

// ============================================================
// Disputes Domain (2 tables)
// ============================================================

// ============================================================
// Audit Log Domain (1 table)
// ============================================================
```

## Test Approach

### Validator Tests (TDD)

Each validator file gets a co-located `.test.ts` following existing patterns:

1. **Enum schema tests**: Accept all valid values, reject invalid values
2. **Create schema tests**: Accept valid input, reject missing required fields
3. **Bilingual error tests**: Verify error messages contain both Vietnamese and English
4. **Update schema tests**: Accept partial input via `.partial()`
5. **Domain-specific tests**: Inventory constraints (parLevel > 0), rating ranges (1-5), etc.

### Schema Verification (Wave 4)

- `npx convex typecheck`: Validates all v.id() references resolve, indexes are valid
- `pnpm typecheck`: Validates all TypeScript type exports are consumable
- `pnpm test`: Runs all validator tests via Vitest

## Files Created/Modified Summary

### Created (10 new files)
| File | Domain | Type |
|------|--------|------|
| packages/validators/src/equipment.ts | Equipment | Validator |
| packages/validators/src/equipment.test.ts | Equipment | Test |
| packages/validators/src/serviceRequests.ts | Service Requests | Validator |
| packages/validators/src/serviceRequests.test.ts | Service Requests | Test |
| packages/validators/src/providers.ts | Providers | Validator |
| packages/validators/src/providers.test.ts | Providers | Test |
| packages/validators/src/consumables.ts | Consumables | Validator |
| packages/validators/src/consumables.test.ts | Consumables | Test |
| packages/validators/src/disputes.ts | Disputes | Validator |
| packages/validators/src/disputes.test.ts | Disputes | Test |

### Modified (3 existing files)
| File | Change |
|------|--------|
| convex/schema.ts | Add 20 new table definitions with indexes |
| packages/validators/src/index.ts | Add 5 new re-exports |
| packages/db/src/schema.ts | Update JSDoc to document all 23 tables |

## Acceptance Criteria Mapping

| Criterion | Wave | Feature(s) |
|-----------|------|-----------|
| All 8 domains defined | W1-W3 | 1.1-3.5 |
| organizationId on all tables | W1-W3 | 1.2-3.5 |
| Appropriate indexes | W1-W3 | All table features |
| v.union(v.literal()) enums | W1-W3 | 1.1, 2.1, 2.3, 3.1 |
| TypeScript types exported | W1-W3 | 1.7, 2.6, 3.6 |
| Schema deploys cleanly | W4 | 4.3 |
| ~25 tables total | W4 | 4.3 (verification) |
