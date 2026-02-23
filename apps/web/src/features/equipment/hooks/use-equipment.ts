"use client";

import type { PaginatedQueryReference } from "convex/react";
import { api } from "@medilink/db/api";
import { usePaginatedQuery } from "convex/react";

import type { Equipment, EquipmentFilters } from "../types";

const ITEMS_PER_PAGE = 20;

// Cast the api reference since AnyApi with noUncheckedIndexedAccess produces
// `X | undefined` for index access, but the actual generated api is always defined.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const equipmentApi = api.equipment as any;
const listFn: PaginatedQueryReference = equipmentApi.list;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Hook wrapping Convex paginated equipment query.
 *
 * WHY: Centralizes filter state and pagination logic so the list page
 * and other consumers don't need to know about Convex internals.
 * Real-time subscriptions update the list automatically when equipment changes.
 */
export function useEquipment(filters?: EquipmentFilters) {
  const { results, status, loadMore } = usePaginatedQuery(
    listFn,
    {
      status: filters?.status,
      categoryId: filters?.categoryId,
      search: filters?.search,
    },
    { initialNumItems: ITEMS_PER_PAGE },
  );

  return {
    // Cast results to Equipment[] since usePaginatedQuery with any-typed fn returns any[]
    equipment: results as Equipment[],
    isLoading: status === "LoadingFirstPage",
    isLoadingMore: status === "LoadingMore",
    canLoadMore: status === "CanLoadMore",
    loadMore: () => loadMore(ITEMS_PER_PAGE),
  };
}
