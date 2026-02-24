import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { authClient } from "~/utils/auth";

/**
 * WHY: This screen was migrated from tRPC to Convex React Native SDK.
 * tRPC required complex URL resolution (getBaseUrl) and a separate httpBatchLink
 * config per platform. Convex uses a single WebSocket connection configured via
 * EXPO_PUBLIC_CONVEX_URL — zero platform-specific wiring needed.
 *
 * Data now fetched with: useQuery(api.equipment.getById, { id })
 * Same API as web — fully type-safe, real-time by default.
 */

function MobileAuth() {
  const { data: session } = authClient.useSession();

  return (
    <>
      <Text className="text-foreground pb-2 text-center text-xl font-semibold">
        {session?.user.name ? `Hello, ${session.user.name}` : "Not logged in"}
      </Text>
      <Pressable
        onPress={() =>
          session
            ? authClient.signOut()
            : authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
              })
        }
        className="bg-primary flex items-center rounded-sm p-2"
      >
        <Text>{session ? "Sign Out" : "Sign In With Google"}</Text>
      </Pressable>
    </>
  );
}

export default function Index() {
  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "MediLink" }} />
      <View className="bg-background h-full w-full p-4">
        <Text className="text-foreground pb-2 text-center text-5xl font-bold">
          Medi<Text className="text-primary">Link</Text>
        </Text>

        <MobileAuth />

        <View className="py-4">
          <Text className="text-muted-foreground text-center text-sm">
            Convex real-time sync active.{"\n"}
            Use useQuery(api.equipment.list) in your screens.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
