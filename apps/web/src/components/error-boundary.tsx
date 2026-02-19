"use client";

/**
 * Bilingual Error Boundary Components for MediLink.
 *
 * WHY: React error boundaries catch unhandled errors during rendering and
 * display a user-friendly fallback instead of crashing the entire page.
 * Bilingual (Vietnamese primary, English secondary) text follows SPMET
 * Healthcare School's operational requirements — Vietnamese is the primary
 * language for end users (students, staff) while English satisfies technical
 * documentation standards.
 *
 * The ErrorFallback is used both as the `error.tsx` fallback in Next.js
 * App Router route segments and can be embedded in components that need
 * scoped error handling.
 */
import type { ReactNode } from "react";
import React from "react";

// ---------------------------------------------------------------------------
// ErrorFallback — pure presentational component for the error UI
// ---------------------------------------------------------------------------

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Bilingual error fallback UI.
 *
 * Vietnamese is the primary language (shown first), English is secondary.
 * Raw error messages are intentionally hidden from users — they may contain
 * sensitive server information (stack traces, connection strings, etc.).
 * The digest (a safe server-generated error ID) is shown instead so that
 * ops team can correlate with Sentry error reports.
 */
export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div
      data-testid="error-fallback"
      role="alert"
      className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center"
    >
      {/* Error icon (decorative) */}
      <div className="bg-destructive/10 text-destructive flex h-16 w-16 items-center justify-center rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-8 w-8"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* Primary heading — Vietnamese */}
      <div>
        <h2 className="text-foreground text-xl font-semibold">
          {/* Đã xảy ra lỗi / Something went wrong */}
          Đã xảy ra lỗi{" "}
          <span className="text-muted-foreground text-base font-normal">
            / Something went wrong
          </span>
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {/* Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, liên hệ bộ phận kỹ thuật. */}
          Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, liên hệ bộ phận kỹ thuật.{" "}
          <span className="block text-xs">
            Please try again. If the error persists, contact technical support.
          </span>
        </p>
      </div>

      {/* Error digest for ops team correlation with Sentry */}
      {error.digest && (
        <p className="text-muted-foreground font-mono text-xs">
          Mã lỗi / Error ID: {error.digest}
        </p>
      )}

      {/* Reset action — Thử lại / Try again */}
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring rounded-md px-6 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {/* Thử lại / Try again */}
        Thử lại / Try again
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClassErrorBoundary — React class component for catching render errors
// ---------------------------------------------------------------------------

interface ClassErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ClassErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
}

/**
 * Class-based React error boundary.
 *
 * WHY: React error boundaries MUST be class components — there is no
 * hook-based equivalent. This wraps child components and catches errors
 * thrown during rendering, lifecycle methods, or constructors of descendants.
 *
 * The `fallback` prop accepts a render function so callers can customise the
 * error UI. If omitted, the built-in bilingual ErrorFallback is used.
 */
export class ClassErrorBoundary extends React.Component<
  ClassErrorBoundaryProps,
  ClassErrorBoundaryState
> {
  constructor(props: ClassErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.resetError = this.resetError.bind(this);
  }

  static getDerivedStateFromError(error: Error): ClassErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production this would be sent to Sentry.
    // WHY: componentDidCatch is the appropriate lifecycle for side effects
    // after an error is caught (logging, reporting).
    console.error("[MediLink] Unhandled render error:", error, errorInfo);
  }

  resetError() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const error = this.state.error;
      if (this.props.fallback) {
        return this.props.fallback({ error, reset: this.resetError });
      }
      return <ErrorFallback error={error} reset={this.resetError} />;
    }
    return this.props.children;
  }
}
