/**
 * Barrel export for the provider-side quotes feature module.
 *
 * WHY: Single import point for all types, labels, hooks, and components
 * from this feature. Consumers use `import { useIncomingRequests } from "~/features/quotes"`
 * instead of deep-importing from internal paths.
 */

// Types
export type {
  QuoteStatus,
  ServiceRequestStatus,
  ServiceRequestPriority,
  ServiceRequestType,
  IncomingServiceRequest,
  ServiceRequestSummary,
  ProviderQuote,
  QuoteFormInput,
  DeclineInput,
  QuoteDashboardStats,
} from "./types";

// Labels
export { quoteLabels } from "./labels";

// Hooks
export {
  useIncomingRequests,
  type UseIncomingRequestsResult,
} from "./hooks/use-incoming-requests";

export {
  useProviderQuotes,
  type UseProviderQuotesResult,
} from "./hooks/use-provider-quotes";

export {
  useQuoteMutations,
  type UseQuoteMutationsResult,
} from "./hooks/use-quote-mutations";
