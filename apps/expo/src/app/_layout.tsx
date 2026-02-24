import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

import { authClient } from "~/utils/auth";

import "../styles.css";

/**
 * Singleton Convex client for the Expo app.
 *
 * WHY: Using a singleton prevents creating multiple WebSocket connections
 * on re-renders, matching the web app's pattern in convex-client-provider.tsx.
 * EXPO_PUBLIC_CONVEX_URL is the standard Expo prefix for public env vars.
 */
const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud",
  {
    unsavedChangesWarning: false,
  },
);

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    /*
     * WHY ConvexBetterAuthProvider (not ConvexProvider):
     * This project uses Better Auth instead of Clerk. ConvexBetterAuthProvider
     * syncs the Better Auth session token with Convex's auth system, so
     * authenticated queries (ctx.auth.getUserIdentity()) work correctly.
     * Without this, Convex would not receive the JWT needed to identify the user.
     */
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {/*
          The Stack component displays the current page.
          It also allows you to configure your screens
        */}
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#c03484",
          },
          contentStyle: {
            backgroundColor: colorScheme == "dark" ? "#09090B" : "#FFFFFF",
          },
        }}
      />
      <StatusBar />
    </ConvexBetterAuthProvider>
  );
}
