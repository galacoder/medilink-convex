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
const authConfig = {
  // vi: "Danh sách nhà cung cấp xác thực" / en: "Authentication providers"
  // Providers are configured in auth.ts based on environment variables
  socialProviders: {} as Record<string, unknown>,

  // vi: "Cấu hình email và mật khẩu" / en: "Email/password configuration"
  emailAndPassword: {
    enabled: true,
  },
} as const;

export default authConfig;
