/**
 * Type definitions for admin billing payment management.
 *
 * WHY: Types mirror convex/schema.ts payments table so the feature module
 * works in tests without a live Convex deployment.
 *
 * vi: "Kieu du lieu quan ly thanh toan" / en: "Payment management types"
 */

// Payment status enum (from schema)
export type PaymentStatus = "pending" | "confirmed" | "rejected" | "refunded";

// Payment method enum
export type PaymentMethod =
  | "bank_transfer"
  | "cash"
  | "momo"
  | "vnpay"
  | "other";

// Payment type enum
export type PaymentType =
  | "subscription_new"
  | "subscription_renewal"
  | "ai_credits"
  | "upgrade"
  | "other";

// Payment document shape (from listPayments query with org join)
export interface PaymentListItem {
  _id: string;
  _creationTime: number;
  organizationId: string;
  organizationName: string;
  amountVnd: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  status: PaymentStatus;
  bankReference?: string;
  bankName?: string;
  transferDate?: number;
  invoiceNumber?: string;
  notes?: string;
  confirmedBy?: string;
  confirmedAt?: number;
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
}

// Payment detail (from getPaymentDetail query)
export interface PaymentDetail extends PaymentListItem {
  subscriptionId?: string;
  subscription?: {
    _id: string;
    plan: string;
    status: string;
    startDate: number;
    endDate: number;
  } | null;
  confirmedByName?: string;
}

// Filter state for payment list
export interface PaymentFilters {
  statusFilter?: PaymentStatus | "all";
  organizationId?: string;
  searchQuery?: string;
}

// Payment list result (from listPayments query)
export interface PaymentListResult {
  payments: PaymentListItem[];
  total: number;
}

// Record payment form data
export interface RecordPaymentFormData {
  organizationId: string;
  amountVnd: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  bankReference?: string;
  bankName?: string;
  transferDate?: number;
  invoiceNumber?: string;
  notes?: string;
  confirmImmediately?: boolean;
}
