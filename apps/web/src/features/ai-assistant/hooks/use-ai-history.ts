"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */

/**
 * Hook for managing AI conversation history via Convex.
 *
 * WHY: Provides real-time conversation list, CRUD operations, and message
 * management. Uses useQuery for reactive data and useMutation for writes.
 *
 * vi: "Hook lich su hoi thoai AI" / en: "AI conversation history hook"
 */
import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@medilink/backend";

import type {
  AiConversation,
  AiMessageRole,
  UseAiHistoryReturn,
} from "../types";

/**
 * Returns AI conversation history, selection state, and CRUD mutations.
 *
 * vi: "Hook lich su AI" / en: "AI history hook"
 */
export function useAiHistory(
  organizationId: string | undefined,
): UseAiHistoryReturn {
  const rawConversations = useQuery(
    api.aiConversation.list,
    organizationId ? { organizationId: organizationId as any } : "skip",
  );

  const conversations: AiConversation[] = (rawConversations ?? []) as any;
  const isLoading = rawConversations === undefined;

  const [selectedConversation, setSelectedConversation] =
    useState<AiConversation | null>(null);

  // Keep selected conversation in sync with live data
  const currentSelected = selectedConversation
    ? (conversations.find((c) => c._id === selectedConversation._id) ?? null)
    : null;

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

  const createMutation = useMutation(api.aiConversation.create);
  const removeMutation = useMutation(api.aiConversation.remove);
  const addMessageMutation = useMutation(api.aiConversation.addMessage);

  const createConversation = useCallback(
    async (titleVi: string, titleEn: string): Promise<string> => {
      if (!organizationId) {
        throw new Error("No active organization");
      }
      const id = await createMutation({
        organizationId: organizationId as any,
        titleVi,
        titleEn,
      });
      return id as string;
    },
    [createMutation, organizationId],
  );

  const deleteConversation = useCallback(
    async (id: string): Promise<void> => {
      await removeMutation({ id: id as any });
      if (selectedConversation?._id === id) {
        setSelectedConversation(null);
      }
    },
    [removeMutation, selectedConversation],
  );

  const addMessage = useCallback(
    async (
      conversationId: string,
      role: AiMessageRole,
      content: string,
    ): Promise<void> => {
      await addMessageMutation({
        id: conversationId as any,
        role,
        content,
      });
    },
    [addMessageMutation],
  );

  return {
    conversations,
    isLoading,
    selectedConversation: currentSelected,
    selectConversation,
    clearSelection,
    createConversation,
    deleteConversation,
    addMessage,
  };
}
