/**
 * Better Auth configuration for the Convex backend.
 *
 * WHY: convex/auth.ts imports this config and passes it to betterAuth().
 * Centralizing the config here keeps auth.ts focused on Convex-specific
 * wiring and allows the config to be shared or tested independently.
 *
 * vi: "Cấu hình xác thực Better Auth" / en: "Better Auth configuration"
 */

/**
 * Minimal Better Auth configuration.
 *
 * The full auth configuration (providers, plugins, etc.) is assembled in
 * convex/auth.ts using @convex-dev/better-auth. This file provides the
 * base options that are environment-agnostic.
 *
 * vi: "Cấu hình cơ bản Better Auth" / en: "Base Better Auth options"
 */
/**
 * Convex JWT provider configuration.
 *
 * WHY: The @convex-dev/better-auth `convex()` plugin requires a standard Convex
 * AuthConfig specifying which JWT issuer Convex should trust for token verification.
 * The domain must match the Convex deployment URL set via CONVEX_SITE_URL env var.
 *
 * In development: CONVEX_SITE_URL is set by `npx convex dev` automatically.
 * In production: Set `npx convex env set CONVEX_SITE_URL https://your-site.com`
 *
 * vi: "Cấu hình JWT Convex" / en: "Convex JWT provider configuration"
 */
const authConfig = {
  providers: [
    {
      // Domain where Better Auth issues JWTs that Convex will verify.
      // WHY: Convex validates incoming JWTs against this issuer URL.
      domain: process.env.CONVEX_SITE_URL ?? "http://localhost:3000",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
