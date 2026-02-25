/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_analytics from "../admin/analytics.js";
import type * as admin_auditLog from "../admin/auditLog.js";
import type * as admin_hospitals from "../admin/hospitals.js";
import type * as admin_providers from "../admin/providers.js";
import type * as admin_serviceRequests from "../admin/serviceRequests.js";
import type * as aiAssistant from "../aiAssistant.js";
import type * as auth from "../auth.js";
import type * as consumables from "../consumables.js";
import type * as equipment from "../equipment.js";
import type * as lib_auditLog from "../lib/auditLog.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_statusMachine from "../lib/statusMachine.js";
import type * as lib_workflowStateMachine from "../lib/workflowStateMachine.js";
import type * as memberships from "../memberships.js";
import type * as notifications from "../notifications.js";
import type * as orgActions from "../orgActions.js";
import type * as organizations from "../organizations.js";
import type * as qrCodes from "../qrCodes.js";
import type * as quotes from "../quotes.js";
import type * as seed from "../seed.js";
import type * as seedData_admin from "../seedData/admin.js";
import type * as seedData_equipment from "../seedData/equipment.js";
import type * as seedData_hospitalWorkflow from "../seedData/hospitalWorkflow.js";
import type * as seedData_organizations from "../seedData/organizations.js";
import type * as seedData_providerRichness from "../seedData/providerRichness.js";
import type * as seedData_serviceRequests from "../seedData/serviceRequests.js";
import type * as seedData_users from "../seedData/users.js";
import type * as seedHelpers from "../seedHelpers.js";
import type * as serviceRequests from "../serviceRequests.js";
import type * as userActions from "../userActions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/analytics": typeof admin_analytics;
  "admin/auditLog": typeof admin_auditLog;
  "admin/hospitals": typeof admin_hospitals;
  "admin/providers": typeof admin_providers;
  "admin/serviceRequests": typeof admin_serviceRequests;
  aiAssistant: typeof aiAssistant;
  auth: typeof auth;
  consumables: typeof consumables;
  equipment: typeof equipment;
  "lib/auditLog": typeof lib_auditLog;
  "lib/auth": typeof lib_auth;
  "lib/permissions": typeof lib_permissions;
  "lib/statusMachine": typeof lib_statusMachine;
  "lib/workflowStateMachine": typeof lib_workflowStateMachine;
  memberships: typeof memberships;
  notifications: typeof notifications;
  orgActions: typeof orgActions;
  organizations: typeof organizations;
  qrCodes: typeof qrCodes;
  quotes: typeof quotes;
  seed: typeof seed;
  "seedData/admin": typeof seedData_admin;
  "seedData/equipment": typeof seedData_equipment;
  "seedData/hospitalWorkflow": typeof seedData_hospitalWorkflow;
  "seedData/organizations": typeof seedData_organizations;
  "seedData/providerRichness": typeof seedData_providerRichness;
  "seedData/serviceRequests": typeof seedData_serviceRequests;
  "seedData/users": typeof seedData_users;
  seedHelpers: typeof seedHelpers;
  serviceRequests: typeof serviceRequests;
  userActions: typeof userActions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
