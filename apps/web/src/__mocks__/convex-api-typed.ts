/**
 * Typed stub for the Convex generated API — used by TypeScript typecheck only.
 *
 * WHY: The real convex/_generated/api is gitignored. This stub provides
 * proper FunctionReference types so `tsc --noEmit` passes without running
 * `npx convex dev`. The tsconfig.json paths alias points here as fallback.
 *
 * At runtime (both dev and test), the real generated file or the vitest
 * alias (convex-api.ts) takes precedence.
 */
import { makeFunctionReference } from "convex/server";

export const api = {
  serviceRequests: {
    listByHospital: makeFunctionReference<"query">(
      "serviceRequests:listByHospital",
    ),
    listByProvider: makeFunctionReference<"query">(
      "serviceRequests:listByProvider",
    ),
    getById: makeFunctionReference<"query">("serviceRequests:getById"),
    create: makeFunctionReference<"mutation">("serviceRequests:create"),
    cancel: makeFunctionReference<"mutation">("serviceRequests:cancel"),
    updateStatus: makeFunctionReference<"mutation">(
      "serviceRequests:updateStatus",
    ),
    declineRequest: makeFunctionReference<"mutation">(
      "serviceRequests:declineRequest",
    ),
    // M3-3: Service execution mutations and queries
    listActiveServices: makeFunctionReference<"query">(
      "serviceRequests:listActiveServices",
    ),
    startService: makeFunctionReference<"mutation">(
      "serviceRequests:startService",
    ),
    updateProgress: makeFunctionReference<"mutation">(
      "serviceRequests:updateProgress",
    ),
    completeService: makeFunctionReference<"mutation">(
      "serviceRequests:completeService",
    ),
    submitCompletionReport: makeFunctionReference<"mutation">(
      "serviceRequests:submitCompletionReport",
    ),
  },
  quotes: {
    accept: makeFunctionReference<"mutation">("quotes:accept"),
    reject: makeFunctionReference<"mutation">("quotes:reject"),
    submit: makeFunctionReference<"mutation">("quotes:submit"),
    listByProvider: makeFunctionReference<"query">("quotes:listByProvider"),
    listByServiceRequest: makeFunctionReference<"query">(
      "quotes:listByServiceRequest",
    ),
  },
  serviceRatings: {
    create: makeFunctionReference<"mutation">("serviceRatings:create"),
  },
  equipment: {
    list: makeFunctionReference<"query">("equipment:list"),
    getById: makeFunctionReference<"query">("equipment:getById"),
    getByCategory: makeFunctionReference<"query">("equipment:getByCategory"),
    getHistory: makeFunctionReference<"query">("equipment:getHistory"),
    getMaintenanceSchedule: makeFunctionReference<"query">(
      "equipment:getMaintenanceSchedule",
    ),
    create: makeFunctionReference<"mutation">("equipment:create"),
    update: makeFunctionReference<"mutation">("equipment:update"),
    updateStatus: makeFunctionReference<"mutation">("equipment:updateStatus"),
    addHistoryEntry: makeFunctionReference<"mutation">(
      "equipment:addHistoryEntry",
    ),
    scheduleMaintenance: makeFunctionReference<"mutation">(
      "equipment:scheduleMaintenance",
    ),
    reportFailure: makeFunctionReference<"mutation">("equipment:reportFailure"),
  },
  disputes: {
    listByHospital: makeFunctionReference<"query">("disputes:listByHospital"),
    getById: makeFunctionReference<"query">("disputes:getById"),
    getMessages: makeFunctionReference<"query">("disputes:getMessages"),
    create: makeFunctionReference<"mutation">("disputes:create"),
    updateStatus: makeFunctionReference<"mutation">("disputes:updateStatus"),
    addMessage: makeFunctionReference<"mutation">("disputes:addMessage"),
    escalate: makeFunctionReference<"mutation">("disputes:escalate"),
    resolve: makeFunctionReference<"mutation">("disputes:resolve"),
  },
  analytics: {
    getProviderSummary: makeFunctionReference<"query">(
      "analytics:getProviderSummary",
    ),
    getProviderRevenueByMonth: makeFunctionReference<"query">(
      "analytics:getProviderRevenueByMonth",
    ),
    getProviderRevenueByServiceType: makeFunctionReference<"query">(
      "analytics:getProviderRevenueByServiceType",
    ),
    getProviderRatings: makeFunctionReference<"query">(
      "analytics:getProviderRatings",
    ),
    getProviderHospitalRelationships: makeFunctionReference<"query">(
      "analytics:getProviderHospitalRelationships",
    ),
  },
  providers: {
    getProfile: makeFunctionReference<"query">("providers:getProfile"),
    listServiceOfferings: makeFunctionReference<"query">(
      "providers:listServiceOfferings",
    ),
    getCertifications: makeFunctionReference<"query">(
      "providers:getCertifications",
    ),
    addServiceOffering: makeFunctionReference<"mutation">(
      "providers:addServiceOffering",
    ),
    updateServiceOffering: makeFunctionReference<"mutation">(
      "providers:updateServiceOffering",
    ),
    removeServiceOffering: makeFunctionReference<"mutation">(
      "providers:removeServiceOffering",
    ),
    addCertification: makeFunctionReference<"mutation">(
      "providers:addCertification",
    ),
    setCoverageArea: makeFunctionReference<"mutation">(
      "providers:setCoverageArea",
    ),
    updateProfile: makeFunctionReference<"mutation">("providers:updateProfile"),
  },
  admin: {
    auditLog: {
      list: makeFunctionReference<"query">("admin/auditLog:list"),
      getById: makeFunctionReference<"query">("admin/auditLog:getById"),
      exportCSV: makeFunctionReference<"query">("admin/auditLog:exportCSV"),
    },
    hospitals: {
      listHospitals: makeFunctionReference<"query">(
        "admin/hospitals:listHospitals",
      ),
      getHospitalDetail: makeFunctionReference<"query">(
        "admin/hospitals:getHospitalDetail",
      ),
      getHospitalUsage: makeFunctionReference<"query">(
        "admin/hospitals:getHospitalUsage",
      ),
      onboardHospital: makeFunctionReference<"mutation">(
        "admin/hospitals:onboardHospital",
      ),
      suspendHospital: makeFunctionReference<"mutation">(
        "admin/hospitals:suspendHospital",
      ),
      reactivateHospital: makeFunctionReference<"mutation">(
        "admin/hospitals:reactivateHospital",
      ),
    },
    providers: {
      listProviders: makeFunctionReference<"query">(
        "admin/providers:listProviders",
      ),
      getProviderDetail: makeFunctionReference<"query">(
        "admin/providers:getProviderDetail",
      ),
      getProviderPerformance: makeFunctionReference<"query">(
        "admin/providers:getProviderPerformance",
      ),
      approveProvider: makeFunctionReference<"mutation">(
        "admin/providers:approveProvider",
      ),
      rejectProvider: makeFunctionReference<"mutation">(
        "admin/providers:rejectProvider",
      ),
      suspendProvider: makeFunctionReference<"mutation">(
        "admin/providers:suspendProvider",
      ),
      verifyCertification: makeFunctionReference<"mutation">(
        "admin/providers:verifyCertification",
      ),
    },
    analytics: {
      getOverviewStats: makeFunctionReference<"query">(
        "admin/analytics:getOverviewStats",
      ),
      getGrowthMetrics: makeFunctionReference<"query">(
        "admin/analytics:getGrowthMetrics",
      ),
      getServiceMetrics: makeFunctionReference<"query">(
        "admin/analytics:getServiceMetrics",
      ),
      getRevenueMetrics: makeFunctionReference<"query">(
        "admin/analytics:getRevenueMetrics",
      ),
      getTopPerformers: makeFunctionReference<"query">(
        "admin/analytics:getTopPerformers",
      ),
      getPlatformHealth: makeFunctionReference<"query">(
        "admin/analytics:getPlatformHealth",
      ),
    },
    serviceRequests: {
      listAllServiceRequests: makeFunctionReference<"query">(
        "admin/serviceRequests:listAllServiceRequests",
      ),
      listEscalatedDisputes: makeFunctionReference<"query">(
        "admin/serviceRequests:listEscalatedDisputes",
      ),
      getDisputeDetail: makeFunctionReference<"query">(
        "admin/serviceRequests:getDisputeDetail",
      ),
      resolveDispute: makeFunctionReference<"mutation">(
        "admin/serviceRequests:resolveDispute",
      ),
      reassignProvider: makeFunctionReference<"mutation">(
        "admin/serviceRequests:reassignProvider",
      ),
    },
  },
  orgActions: {
    createOrganization: makeFunctionReference<"mutation">(
      "orgActions:createOrganization",
    ),
  },
  // M5-1: Notifications — Convex Real-Time Notifications
  notifications: {
    create: makeFunctionReference<"mutation">("notifications:create"),
    listForUser: makeFunctionReference<"query">("notifications:listForUser"),
    markRead: makeFunctionReference<"mutation">("notifications:markRead"),
    markAllRead: makeFunctionReference<"mutation">("notifications:markAllRead"),
    updatePreferences: makeFunctionReference<"mutation">(
      "notifications:updatePreferences",
    ),
    getPreferences: makeFunctionReference<"query">(
      "notifications:getPreferences",
    ),
  },
  // M5-2: Automation — Workflow Rules with Convex Scheduled Functions
  automation: {
    automationLog: {
      listAutomationLogs: makeFunctionReference<"query">(
        "automation/automationLog:listAutomationLogs",
      ),
      getAutomationRuleStatus: makeFunctionReference<"query">(
        "automation/automationLog:getAutomationRuleStatus",
      ),
    },
    rules: {
      checkOverdueRequests: makeFunctionReference<"mutation">(
        "automation/rules:checkOverdueRequests",
      ),
      checkMaintenanceDue: makeFunctionReference<"mutation">(
        "automation/rules:checkMaintenanceDue",
      ),
      checkStockLevels: makeFunctionReference<"mutation">(
        "automation/rules:checkStockLevels",
      ),
      checkCertificationExpiry: makeFunctionReference<"mutation">(
        "automation/rules:checkCertificationExpiry",
      ),
      suggestProviders: makeFunctionReference<"query">(
        "automation/rules:suggestProviders",
      ),
    },
  },
} as const;
