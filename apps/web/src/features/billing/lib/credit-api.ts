/**
 * Typed Convex API references for AI credit queries.
 *
 * WHY: The @medilink/backend stub exports untyped API references.
 * This module casts them to the correct FunctionReference types so
 * components can use useQuery without unsafe-member-access lint errors.
 *
 * vi: "Tham chieu API Convex cho truy van credit AI"
 * en: "Typed Convex API references for AI credit queries"
 *
 * @see Issue #177 -- M1-8: AI Credit Balance UI
 */

import type { FunctionReference } from "convex/server";

import { api } from "@medilink/backend";

// ---------------------------------------------------------------------------
// Return types matching the Convex query handlers
// ---------------------------------------------------------------------------

export interface AiCreditBalance {
  balance: number;
  bonusCredits: number;
  totalAvailable: number;
  monthlyIncluded: number;
  monthlyUsed: number;
  monthlyResetAt: number;
  lifetimeCreditsGranted: number;
  lifetimeCreditsUsed: number;
}

export interface CreditConsumptionRecord {
  _id: string;
  _creationTime: number;
  organizationId: string;
  userId: string;
  userName: string;
  featureId: string;
  creditsUsed: number;
  status: string;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Typed API accessors
// ---------------------------------------------------------------------------

type QueryRef = FunctionReference<"query">;

interface CreditQueriesApi {
  getAiCreditBalance: QueryRef;
  getCreditConsumptionHistory: QueryRef;
}

export const creditQueriesApi = (
  api as unknown as { billing: { credits_queries: CreditQueriesApi } }
).billing.credits_queries;
