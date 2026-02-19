"use client";

/**
 * Next.js App Router error boundary for the service request detail route.
 *
 * WHY: The detail page uses Convex queries that can throw ConvexError on
 * permission denied or data errors. Without an error.tsx, that error crashes
 * the entire page with a white screen. This component provides a bilingual,
 * user-friendly error message with a retry button instead.
 *
 * vi: "Không thể tải chi tiết yêu cầu" / en: "Unable to load request details"
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RequestDetailError({ error, reset }: ErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center"
      data-testid="provider-request-detail-error"
    >
      <h2 className="text-destructive mb-2 text-lg font-semibold">
        Không thể tải chi tiết yêu cầu (Unable to load request details)
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">
        {error.message ||
          "Đã xảy ra lỗi không mong đợi. (An unexpected error occurred.)"}
      </p>
      <button
        onClick={reset}
        className="text-primary hover:text-primary/80 text-sm underline"
        data-testid="provider-request-detail-error-retry"
      >
        Thử lại (Try again)
      </button>
    </div>
  );
}
