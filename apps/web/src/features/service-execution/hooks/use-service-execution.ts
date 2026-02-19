"use client";

/**
 * Hook for provider service execution mutations.
 *
 * WHY: Wraps startService, updateProgress, completeService, and
 * submitCompletionReport with consistent loading state management.
 * Provider staff use these actions on-site from mobile devices — touch-friendly
 * feedback (isSubmitting) prevents double-submissions on slow connections.
 *
 * vi: "Hook thực hiện dịch vụ" / en: "Service execution mutations hook"
 */
import { useState } from "react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";

export interface UseServiceExecutionResult {
  startService: (args: {
    id: string;
    notes?: string;
  }) => Promise<string | null>;
  updateProgress: (args: {
    id: string;
    progressNotes: string;
    percentComplete?: number;
    hasUnexpectedIssue?: boolean;
    unexpectedIssueDescVi?: string;
  }) => Promise<string | null>;
  completeService: (args: { id: string }) => Promise<string | null>;
  submitCompletionReport: (args: {
    id: string;
    workDescriptionVi: string;
    workDescriptionEn?: string;
    partsReplaced?: string[];
    nextMaintenanceRecommendation?: string;
    actualHours?: number;
    photoUrls?: string[];
    actualCompletionTime?: number;
  }) => Promise<string | null>;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Returns mutation handlers for the service execution workflow.
 * All mutations set isSubmitting=true during execution for UX feedback.
 */
export function useServiceExecution(): UseServiceExecutionResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startServiceMutation = useMutation(api.serviceRequests.startService);
  const updateProgressMutation = useMutation(
    api.serviceRequests.updateProgress,
  );
  const completeServiceMutation = useMutation(
    api.serviceRequests.completeService,
  );
  const submitReportMutation = useMutation(
    api.serviceRequests.submitCompletionReport,
  );

  async function startService(args: {
    id: string;
    notes?: string;
  }): Promise<string | null> {
    setIsSubmitting(true);
    setError(null);
    try {
      // WHY: api is AnyApi so mutations return `any`; cast to known return type.
      const result = (await startServiceMutation({
        id: args.id as Id<"serviceRequests">,
        notes: args.notes,
      })) as string;
      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Lỗi không xác định (Unknown error)";
      setError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateProgress(args: {
    id: string;
    progressNotes: string;
    percentComplete?: number;
    hasUnexpectedIssue?: boolean;
    unexpectedIssueDescVi?: string;
  }): Promise<string | null> {
    setIsSubmitting(true);
    setError(null);
    try {
      // WHY: api is AnyApi so mutations return `any`; cast to known return type.
      const result = (await updateProgressMutation({
        id: args.id as Id<"serviceRequests">,
        progressNotes: args.progressNotes,
        percentComplete: args.percentComplete,
        hasUnexpectedIssue: args.hasUnexpectedIssue,
        unexpectedIssueDescVi: args.unexpectedIssueDescVi,
      })) as string;
      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Lỗi không xác định (Unknown error)";
      setError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeService(args: { id: string }): Promise<string | null> {
    setIsSubmitting(true);
    setError(null);
    try {
      // WHY: api is AnyApi so mutations return `any`; cast to known return type.
      const result = (await completeServiceMutation({
        id: args.id as Id<"serviceRequests">,
      })) as string;
      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Lỗi không xác định (Unknown error)";
      setError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCompletionReport(args: {
    id: string;
    workDescriptionVi: string;
    workDescriptionEn?: string;
    partsReplaced?: string[];
    nextMaintenanceRecommendation?: string;
    actualHours?: number;
    photoUrls?: string[];
    actualCompletionTime?: number;
  }): Promise<string | null> {
    setIsSubmitting(true);
    setError(null);
    try {
      // WHY: api is AnyApi so mutations return `any`; cast to known return type.
      const result = (await submitReportMutation({
        id: args.id as Id<"serviceRequests">,
        workDescriptionVi: args.workDescriptionVi,
        workDescriptionEn: args.workDescriptionEn,
        partsReplaced: args.partsReplaced,
        nextMaintenanceRecommendation: args.nextMaintenanceRecommendation,
        actualHours: args.actualHours,
        photoUrls: args.photoUrls,
        actualCompletionTime: args.actualCompletionTime,
      })) as string;
      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Lỗi không xác định (Unknown error)";
      setError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    startService,
    updateProgress,
    completeService,
    submitCompletionReport,
    isSubmitting,
    error,
  };
}
