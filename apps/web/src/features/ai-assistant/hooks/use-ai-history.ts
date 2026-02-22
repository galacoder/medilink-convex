"use client";

/**
 * Hook for managing AI conversation history.
 *
 * WHY: This is a skeleton hook for Wave 1. The aiConversation Convex table
 * will be added in Wave 2 (Schema Extensions). For now, this hook returns
 * an empty list and no-op functions so the UI can be built ahead of the
 * persistence layer.
 *
 * Wire-up plan (Wave 2):
 *   - Replace empty array with useQuery(api.aiAssistant.listConversations, ...)
 *   - Implement selectConversation to fetch single conversation
 *
 * vi: "Hook lịch sử hội thoại AI (skeleton)" / en: "AI history hook (skeleton for Wave 2)"
 */
import { useCallback, useMemo, useState } from "react";

import type { AiConversation, UseAiHistoryReturn } from "../types";

/**
 * Returns AI conversation history and selection state.
 *
 * NOTE: Returns empty data in Wave 1. Wired to Convex in Wave 2.
 *
 * vi: "Hook lịch sử AI" / en: "AI history hook"
 */
export function useAiHistory(): UseAiHistoryReturn {
  // Skeleton: no conversations until Wave 2 adds the aiConversation table.
  // WHY useMemo: stable reference avoids exhaustive-deps warning in selectConversation.
  const conversations = useMemo<AiConversation[]>(() => [], []);
  const isLoading = false;

  const [selectedConversation, setSelectedConversation] =
    useState<AiConversation | null>(null);

  const selectConversation = useCallback(
    (id: string) => {
      const found = conversations.find((c) => c._id === id) ?? null;
      setSelectedConversation(found);
    },
    [conversations],
  );

  const clearSelection = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  return {
    conversations,
    isLoading,
    selectedConversation,
    selectConversation,
    clearSelection,
  };
}
