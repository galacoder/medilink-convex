// TODO: M0-2 — tRPC client removed as part of M0 Pure Convex migration.
// TODO: M0-6 — Replace with Convex useQuery/useMutation hooks.
//
// Original tRPC client used:
//   - createTRPCClient + httpBatchLink from "@trpc/client"
//   - createTRPCOptionsProxy from "@trpc/tanstack-react-query"
//   - AppRouter, RouterInputs, RouterOutputs from "@medilink/api"
//
// WHY removed: tRPC and Convex solve the same problem (type-safe data access).
// The official get-convex/turbo-expo-nextjs-clerk-convex-monorepo template
// uses zero tRPC. Convex provides equal type safety via useQuery/useMutation.
//
// See: issue #146 (M0-6) for Expo Convex migration.

export {};
