import type { ReactNode } from "react";

/**
 * Auth layout — centers auth pages without sidebar.
 *
 * WHY: Auth pages (sign-in, sign-up) need a minimal, centered layout
 * separate from the portal layouts (which have sidebar + header).
 * The route group (auth) applies this layout only to auth pages.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
