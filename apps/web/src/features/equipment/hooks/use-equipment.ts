"use client";

import {
  type PaginatedQueryReference,
  usePaginatedQuery,
} from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import type { EquipmentFilters } from "../types";

const ITEMS_PER_PAGE = 20;

// Cast the api reference since AnyApi with noUncheckedIndexedAccess produces
// `X | undefined` for index access, but the actual generated api is always defined.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const equipmentApi = api.equipment as any;

/**
 * Hook wrapping Convex paginated equipment query.
 *
 * WHY: Centralizes filter state and pagination logic so the list page
 * and other consumers don't need to know about Convex internals.
 * Real-time subscriptions update the list automatically when equipment changes.
 */
export function useEquipment(filters?: EquipmentFilters) {
  const { results, status, loadMore } = usePaginatedQuery(
    equipmentApi.list as PaginatedQueryReference,
    {
      status: filters?.status,
      categoryId: filters?.categoryId as Id<"equipmentCategories"> | undefined,
      search: filters?.search,
    },
    { initialNumItems: ITEMS_PER_PAGE },
  );

  return {
    equipment: results,
    isLoading: status === "LoadingFirstPage",
    isLoadingMore: status === "LoadingMore",
    canLoadMore: status === "CanLoadMore",
    loadMore: () => loadMore(ITEMS_PER_PAGE),
  };
}
