"use client";

/**
 * Hook for interacting with the AI assistant via Convex actions.
 *
 * WHY: Wraps the 3 Convex AI actions (queryEquipment, draftServiceRequest,
 * answerAnalyticsQuestion) in a unified hook interface. Components use this
 * hook instead of calling Convex actions directly, keeping the Convex API
 * surface in one place and providing loading/error state management.
 *
 * vi: "Hook tương tác với trợ lý AI" / en: "Hook for AI assistant interactions"
 */
import { useCallback, useState } from "react";
import { useAction } from "convex/react";

import { api } from "@medilink/backend";

import type {
  AnalyticsAnswer,
  EquipmentQueryResult,
  ServiceRequestDraft,
  UseAiAssistantReturn,
} from "../types";

/**
 * Provides callable functions for the 3 AI assistant Convex actions.
 *
 * - `queryEquipment(query, orgId)`: Natural language equipment search
 * - `draftServiceRequest(desc, orgId)`: AI-assisted service request drafting
 * - `answerAnalyticsQuestion(question, orgId)`: Analytics Q&A
 * - `isLoading`: true during any action call
 * - `error`: error message string, or null
 *
 * vi: "Hook trợ lý AI" / en: "AI assistant hook"
 */
export function useAiAssistant(): UseAiAssistantReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryEquipmentAction = useAction(api.aiAssistant.queryEquipment);
  const draftServiceRequestAction = useAction(
    api.aiAssistant.draftServiceRequest,
  );
  const answerAnalyticsQuestionAction = useAction(
    api.aiAssistant.answerAnalyticsQuestion,
  );

  const queryEquipment = useCallback(
    async (
      query: string,
      organizationId: string,
    ): Promise<EquipmentQueryResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = (await queryEquipmentAction({
          query,
          organizationId,
        })) as {
          equipmentIds: string[];
          summary: string;
        };
        return {
          equipmentIds: result.equipmentIds,
          summary: result.summary,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [queryEquipmentAction],
  );

  const draftServiceRequest = useCallback(
    async (
      description: string,
      organizationId: string,
    ): Promise<ServiceRequestDraft> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = (await draftServiceRequestAction({
          description,
          organizationId,
        })) as {
          descriptionSuggestion?: string;
          urgency: "high" | "medium" | "low";
        };
        return {
          descriptionVi: result.descriptionSuggestion ?? description,
          descriptionEn: undefined,
          urgency: result.urgency,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [draftServiceRequestAction],
  );

  const answerAnalyticsQuestion = useCallback(
    async (
      question: string,
      organizationId: string,
    ): Promise<AnalyticsAnswer> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = (await answerAnalyticsQuestionAction({
          question,
          organizationId,
        })) as {
          answer: string;
          dataPoints?: Record<string, unknown>;
        };
        return {
          answer: result.answer,
          data: result.dataPoints,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [answerAnalyticsQuestionAction],
  );

  return {
    queryEquipment,
    draftServiceRequest,
    answerAnalyticsQuestion,
    isLoading,
    error,
  };
}
