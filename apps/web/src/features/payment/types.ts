/**
 * Type definitions for the payment feature module.
 *
 * WHY: Types mirror the convex/schema.ts payment table so the feature module
 * works in tests without a live Convex deployment.
 *
 * vi: "Kieu du lieu thanh toan" / en: "Payment types"
 */

// Payment status enum
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

// Payment document shape (mirrors convex/schema.ts)
export interface Payment {
  _id: string;
  _creationTime: number;
  organizationId: string;
  paidBy: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  descriptionVi: string;
  descriptionEn?: string;
  serviceRequestId?: string;
  paidAt?: number;
  createdAt: number;
  updatedAt: number;
}

// Filter state for payment list
export interface PaymentFilters {
  status?: PaymentStatus;
}
