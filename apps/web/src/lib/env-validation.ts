/* eslint-disable no-restricted-properties */
/**
 * Production environment variable validation utility.
 *
 * WHY: Missing environment variables in production cause runtime failures that
 * are hard to debug — the app may start but crash on first request, or fail
 * silently with cryptic errors. This utility validates all required vars at
 * startup so failures are immediate, explicit, and list all missing vars
 * in a single check (fail-fast pattern).
 *
 * WHY eslint-disable no-restricted-properties: This module is deliberately
 * designed to read raw process.env values BEFORE the T3 env validation runs.
 * It is the startup validator that verifies env vars are present — using
 * `import { env } from '~/env'` would defeat its purpose because ~/env throws
 * when vars are missing (the very condition this module is meant to detect).
 *
 * Usage in scripts/validate-env.ts:
 *   const result = validateProductionEnv();
 *   if (!result.valid) { console.error(result.errorSummary); process.exit(1); }
 */

/**
 * Required environment variables for production deployment.
 * Each entry has the variable name and a human-readable description.
 */
const REQUIRED_PRODUCTION_VARS: { name: string; description: string }[] = [
  {
    name: "NEXT_PUBLIC_CONVEX_URL",
    description:
      "Convex deployment URL (get from https://dashboard.convex.dev)",
  },
  {
    name: "AUTH_SECRET",
    description:
      "Better Auth session signing key (generate: openssl rand -base64 32)",
  },
  {
    name: "CONVEX_DEPLOYMENT",
    description: "Convex deployment identifier for server-side operations",
  },
];

export interface EnvValidationResult {
  /** True if all required environment variables are present */
  valid: boolean;
  /** List of missing variable names */
  missing: string[];
  /** Human-readable summary for logging; empty string when valid */
  errorSummary: string;
}

/**
 * Validates that all required production environment variables are set.
 *
 * Returns a result object rather than throwing, so callers can decide
 * whether to fail hard (CI/startup) or degrade gracefully (health check).
 */
export function validateProductionEnv(): EnvValidationResult {
  const missing: string[] = [];

  for (const variable of REQUIRED_PRODUCTION_VARS) {
    const value = process.env[variable.name];
    if (!value || value.trim() === "") {
      missing.push(variable.name);
    }
  }

  if (missing.length === 0) {
    return { valid: true, missing: [], errorSummary: "" };
  }

  const missingDetails = missing
    .map((name) => {
      const varInfo = REQUIRED_PRODUCTION_VARS.find((v) => v.name === name);
      return varInfo ? `  - ${name}: ${varInfo.description}` : `  - ${name}`;
    })
    .join("\n");

  const errorSummary = [
    `Missing ${missing.length} required environment variable(s):`,
    missingDetails,
    "",
    "Copy .env.example to .env and populate all required values.",
    "See DEPLOYMENT.md for the full setup guide.",
  ].join("\n");

  return { valid: false, missing, errorSummary };
}
