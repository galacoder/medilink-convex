# DISCOVERY.md -- M1-1: Core Convex Schema

## Current State

**3 existing tables** in `convex/schema.ts`:

| Table | Fields | Indexes |
|-------|--------|---------|
| organizations | name, slug, org_type, createdAt, updatedAt | by_type, by_slug |
| organizationMemberships | orgId, userId, role, createdAt, updatedAt | by_org, by_user, by_org_and_user |
| users | name, email, platformRole (optional), createdAt, updatedAt | (none) |

**2 existing validators** in `packages/validators/src/`:
- `auth.ts` (signUp, signIn, orgSignUp, passwordReset schemas)
- `organizations.ts` (orgType, memberRole, platformRole, create/update schemas)

**0 test files for schema** -- only validator tests exist (auth.test.ts: 251 lines, organizations.test.ts: 124 lines).

## Target State

**23 total tables** (20 new + 3 existing) across 8 domains:

### Domain Table Breakdown

| Domain | New Tables | Count |
|--------|-----------|-------|
| Equipment | equipmentCategories, equipment, equipmentHistory, maintenanceRecords, failureReports | 5 |
| QR Code | qrCodes, qrScanLog | 2 |
| Service Requests | serviceRequests, quotes, serviceRatings | 3 |
| Providers | providers, serviceOfferings, certifications, coverageAreas | 4 |
| Consumables | consumables, consumableUsageLog, reorderRequests | 3 |
| Consumer Mgmt | (uses existing organizationMemberships + users) | 0 |
| Disputes | disputes, disputeMessages | 2 |
| Audit Log | auditLog | 1 |
| **Total new** | | **20** |

### Consolidation from Legacy

Legacy Drizzle (35+ tables) to Convex (23 tables):
- Service request history folded into centralized auditLog
- Consumable lots/alerts/transactions simplified to consumableUsageLog + reorderRequests
- Provider availability/performance/verification collapsed into providers table + certifications
- Equipment-consumable junction table removed (use direct FK in consumableUsageLog)

## Established Convex Patterns

Derived from reading `convex/schema.ts` (lines 1-68):

```typescript
// Timestamps: v.number() for epoch milliseconds
createdAt: v.number(),
updatedAt: v.number(),

// Enums: v.union(v.literal()) -- NOT v.string()
status: v.union(v.literal("operational"), v.literal("maintenance")),

// Foreign keys: v.id("tableName")
organizationId: v.id("organizations"),

// Indexes: by_<field> naming convention
.index("by_org", ["organizationId"])
.index("by_status", ["status"])
.index("by_org_and_user", ["orgId", "userId"])  // compound index

// Multi-tenancy: Every domain table gets organizationId + by_org index
```

## Bilingual Validator Patterns

Derived from reading `packages/validators/src/auth.ts` and `organizations.ts`:

```typescript
// Import pattern
import { z } from "zod/v4";

// Enum schemas
export const equipmentStatusSchema = z.enum(["operational", "maintenance", "repair", "retired"]);

// Bilingual error messages (Vietnamese / English)
name: z.string().min(2, "Ten phai co it nhat 2 ky tu (Name must be at least 2 characters)"),

// Create schema with composition
export const createEquipmentSchema = z.object({ ... });

// Update schema via .partial()
export const updateEquipmentSchema = createEquipmentSchema.partial();

// Type inference exports
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
```

## Enum Types per Domain

### Equipment Domain
| Enum | Values | Legacy Source |
|------|--------|-------------|
| equipmentStatus | operational, maintenance, repair, retired | equipment_status |
| equipmentCriticality | A, B, C | equipment_criticality |
| maintenanceStatus | scheduled, in_progress, completed, overdue, cancelled | maintenance_status |
| recurringPattern | none, daily, weekly, monthly, quarterly, yearly | recurring_pattern |
| failureUrgency | critical, high, medium, low | failure_urgency |
| failureStatus | reported, assigned, in_progress, resolved, closed | failure_status |

### Service Request Domain
| Enum | Values | Legacy Source |
|------|--------|-------------|
| serviceRequestStatus | pending, quoted, accepted, in_progress, completed, cancelled | service_request_status |
| serviceRequestType | repair, maintenance, calibration, inspection, other | service_request_type |
| serviceRequestPriority | low, medium, high, critical | service_request_priority |
| quoteStatus | pending, forwarded, accepted, rejected, expired | quote_status |

### Provider Domain
| Enum | Values | Legacy Source |
|------|--------|-------------|
| providerStatus | active, inactive, suspended | provider_status |
| providerVerificationStatus | pending, in_review, verified, rejected | provider_verification_status |
| serviceSpecialty | general_repair, imaging_equipment, laboratory_equipment, surgical_equipment, monitoring_equipment, life_support, diagnostic_equipment, sterilization_equipment, other | service_specialty |

### Consumables Domain
| Enum | Values | Legacy Source |
|------|--------|-------------|
| consumableCategoryType | clinical_diagnostic, surgical, disposable, ppe, laboratory, patient_care, maintenance | consumable_category_type |
| transactionType | RECEIVE, USAGE, ADJUSTMENT, WRITE_OFF | transaction_type |
| alertSeverity | info, warning, critical | alert_severity |

### Disputes Domain
| Enum | Values | Legacy Source |
|------|--------|-------------|
| disputeStatus | open, investigating, resolved, escalated | dispute_status |

### Audit Log Domain
| Enum | Values | New |
|------|--------|-----|
| auditAction | create, update, delete, status_change | (new for Convex) |

## Index Strategy

Every table gets at minimum:
1. `by_org` on `organizationId` (multi-tenancy isolation)
2. `by_<primary_lookup>` for common query patterns

Domain-specific indexes:
- Equipment: by_org, by_status, by_category, by_assignedTo, compound org+serialNumber
- Service Requests: by_org, by_status, by_equipment, by_requester
- Providers: by_org, by_status, by_verificationStatus
- Consumables: by_org, by_categoryType, compound org+sku
- Disputes: by_org, by_status, by_serviceRequest
- Audit Log: by_org, by_user, by_entityType, by_createdAt

## Cross-Domain Dependencies

```
organizations (existing)
  |
  +-- equipment (Wave 1)
  |     |
  |     +-- equipmentHistory (Wave 1)
  |     +-- maintenanceRecords (Wave 1)
  |     +-- failureReports (Wave 1)
  |     +-- qrCodes (Wave 1)
  |     +-- qrScanLog (Wave 1)
  |     +-- serviceRequests (Wave 2) -- references equipment
  |     +-- consumableUsageLog (Wave 3) -- optional equipment ref
  |
  +-- serviceRequests (Wave 2)
  |     +-- quotes (Wave 2)
  |     +-- serviceRatings (Wave 2)
  |     +-- disputes (Wave 3) -- references serviceRequests
  |
  +-- providers (Wave 2)
  |     +-- serviceOfferings (Wave 2)
  |     +-- certifications (Wave 2)
  |     +-- coverageAreas (Wave 2)
  |
  +-- consumables (Wave 3)
  |     +-- consumableUsageLog (Wave 3)
  |     +-- reorderRequests (Wave 3)
  |
  +-- auditLog (Wave 3) -- standalone cross-domain
```

## Legacy Reference Paths (READ-ONLY)

| Domain | Legacy File | Lines |
|--------|------------|-------|
| Equipment | /home/sangle/dev/project-medilink/packages/plugins/equipment/backend/schema.ts | 357 |
| Service Requests | /home/sangle/dev/project-medilink/packages/plugins/service-requests/backend/schema.ts | 280 |
| QR Code | /home/sangle/dev/project-medilink/packages/plugins/qr-code/backend/schema.ts | 94 |
| Providers | /home/sangle/dev/project-medilink/packages/plugins/providers/backend/schema.ts | 333 |
| Consumables | /home/sangle/dev/project-medilink/packages/plugins/consumables/backend/schema.ts | 437 |
| Disputes | /home/sangle/dev/project-medilink/packages/plugins/disputes/backend/schema.ts | 124 |
| Audit Log | (no schema -- was router-only in legacy) | N/A |
| Consumer Mgmt | (no schema -- used core users/orgs) | N/A |

## Risks

1. **Schema file size**: Adding 20 tables to a single schema.ts may reach 500+ lines. Convex schema files must be single-file, so this is unavoidable but manageable with clear section comments.
2. **Cross-domain FK ordering**: Convex defineTable declarations must appear before they are referenced by v.id(). Equipment must be defined before serviceRequests, serviceRequests before disputes.
3. **Enum explosion**: 17 enum type definitions (using v.union) add visual noise. Group them by domain with clear comment separators.
4. **Convex limitations**: No unique constraints (unlike Drizzle uniqueIndex). Serial number uniqueness must be enforced at the mutation level, not schema level.

## Test Strategy

- **Framework**: Vitest v3.0.0 with workspace config
- **Pattern**: safeParse() for non-throwing validation, bilingual error message assertions
- **Coverage target**: All enum schemas, all create/update schemas, all bilingual error paths
- **Files**: 5 new test files (equipment, serviceRequests, providers, consumables, disputes)
- **Estimated tests**: ~40-50 test cases across all files
