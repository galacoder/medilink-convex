/**
 * WHY: This file was a T3 Turbo template placeholder using tRPC `post.byId`.
 * There is no `post` module in the MediLink Convex backend.
 *
 * For equipment detail screens, use:
 *   import { useQuery } from "convex/react";
 *   import { api } from "@medilink/backend";
 *   const equipment = useQuery(api.equipment.getById, { id });
 *
 * This file is preserved as a migration note. Replace with your actual
 * domain screen (e.g., equipment/[id].tsx) using the Convex pattern above.
 */

import { SafeAreaView, Text, View } from "react-native";
import { Stack, useGlobalSearchParams } from "expo-router";
import { useQuery } from "convex/react";

import type { Id } from "@medilink/backend";
import { api } from "@medilink/backend";

export default function EquipmentDetail() {
  const { id } = useGlobalSearchParams<{ id: string }>();

  /**
   * WHY: Replaced tRPC `trpc.post.byId.queryOptions({ id })` with Convex
   * `useQuery(api.equipment.getById, { id })`.
   * No queryClient, no invalidation — Convex subscriptions handle real-time
   * updates automatically.
   *
   * WHY cast: useGlobalSearchParams returns string | string[]; we assert
   * it is a valid equipment Id for the query args type.
   */
  const equipment = useQuery(
    api.equipment.getById,
    id ? { id: id as Id<"equipment"> } : "skip",
  );

  if (!equipment) return null;

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: equipment.nameVi }} />
      <View className="h-full w-full p-4">
        <Text className="text-primary py-2 text-3xl font-bold">
          {equipment.nameVi}
        </Text>
        <Text className="text-foreground py-4">
          {equipment.category?.nameVi ?? ""}
        </Text>
      </View>
    </SafeAreaView>
  );
}
