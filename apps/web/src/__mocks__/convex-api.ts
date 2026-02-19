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
    listByProvider: "serviceRequests:listByProvider",
    getById: "serviceRequests:getById",
    create: "serviceRequests:create",
    cancel: "serviceRequests:cancel",
    updateStatus: "serviceRequests:updateStatus",
    declineRequest: "serviceRequests:declineRequest",
  },
  quotes: {
    accept: "quotes:accept",
    reject: "quotes:reject",
    submit: "quotes:submit",
    listByProvider: "quotes:listByProvider",
    listByServiceRequest: "quotes:listByServiceRequest",
  },
  serviceRatings: {
    create: "serviceRatings:create",
  },
  equipment: {
    list: "equipment:list",
    getById: "equipment:getById",
  },
  disputes: {
    listByHospital: "disputes:listByHospital",
    getById: "disputes:getById",
    getMessages: "disputes:getMessages",
    create: "disputes:create",
    updateStatus: "disputes:updateStatus",
    addMessage: "disputes:addMessage",
    escalate: "disputes:escalate",
    resolve: "disputes:resolve",
  },
  providers: {
    getProfile: "providers:getProfile",
    listServiceOfferings: "providers:listServiceOfferings",
    getCertifications: "providers:getCertifications",
    addServiceOffering: "providers:addServiceOffering",
    updateServiceOffering: "providers:updateServiceOffering",
    removeServiceOffering: "providers:removeServiceOffering",
    addCertification: "providers:addCertification",
    setCoverageArea: "providers:setCoverageArea",
    updateProfile: "providers:updateProfile",
  },
} as const;
