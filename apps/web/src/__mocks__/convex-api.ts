/**
 * Mock stub for the Convex generated API.
 *
 * WHY: The real convex/_generated/api is gitignored and only exists when
 * `npx convex dev` has been run. This stub provides function reference
 * strings so tests can import hooks without the generated files present.
 *
 * Tests use vi.mock("convex/react") to mock useQuery/useMutation, so
 * the actual function references just need to be distinguishable strings.
 * The vitest.config.ts alias points here, keeping tests compatible.
 */

export const api = {
  serviceRequests: {
    listByHospital: "serviceRequests:listByHospital",
    getById: "serviceRequests:getById",
    create: "serviceRequests:create",
    cancel: "serviceRequests:cancel",
    updateStatus: "serviceRequests:updateStatus",
  },
  quotes: {
    accept: "quotes:accept",
    reject: "quotes:reject",
    submit: "quotes:submit",
  },
  serviceRatings: {
    create: "serviceRatings:create",
  },
  equipment: {
    list: "equipment:list",
    getById: "equipment:getById",
  },
} as const;
