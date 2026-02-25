/**
 * Content Security Policy (CSP) utilities.
 *
 * WHY: Free-text fields in Convex (notes, descriptions, progressNotes) are stored
 * as plain strings. CSP headers block inline script execution system-wide, so even
 * if malicious HTML were stored and rendered, the browser refuses to execute it.
 *
 * Uses nonce-based CSP with 'strict-dynamic' for compatibility with Next.js
 * script loading patterns.
 */

/**
 * Generate a cryptographically random nonce for CSP headers.
 *
 * WHY: Each request gets a unique nonce so only scripts explicitly tagged
 * with that nonce can execute. This prevents injection of rogue scripts.
 */
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

/**
 * Build the Content-Security-Policy header value.
 *
 * @param nonce - Base64-encoded nonce for this request
 * @param isDev - Whether running in development mode (adds 'unsafe-eval' for HMR)
 */
export function buildCspHeader(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
