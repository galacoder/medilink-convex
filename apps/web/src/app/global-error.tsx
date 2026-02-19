"use client";

/**
 * Next.js Global Error Page.
 *
 * WHY: This file is the top-level error boundary for the entire Next.js app.
 * It catches errors that occur in the root layout (layout.tsx) or any segment
 * that does not have its own error.tsx boundary. It must render a minimal HTML
 * document because the root layout may be unavailable when this renders.
 *
 * Per Next.js App Router conventions, global-error.tsx replaces the root
 * layout during rendering, so it must include <html> and <body> tags.
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error fallback — renders a minimal bilingual error page.
 * Vietnamese is the primary language (SPMET Healthcare School standard),
 * English is secondary for technical staff and international compatibility.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="vi">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "#111",
            }}
          >
            {/* Đã xảy ra lỗi hệ thống / System error occurred */}
            Đã xảy ra lỗi hệ thống
            <br />
            <span
              style={{ fontSize: "1.125rem", fontWeight: 400, color: "#555" }}
            >
              System error occurred
            </span>
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              color: "#666",
              maxWidth: "400px",
              marginBottom: "1.5rem",
            }}
          >
            {/* Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, liên hệ bộ phận kỹ thuật SPMET. */}
            Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, liên hệ bộ phận kỹ thuật
            SPMET.
            <br />
            <span style={{ color: "#888" }}>
              Please try again. If the error persists, contact SPMET technical
              support.
            </span>
          </p>

          {/* Error digest for ops team — safe server-generated ID, not raw error */}
          {error.digest && (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#999",
                marginBottom: "1.5rem",
              }}
            >
              Mã lỗi / Error ID: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {/* Thử lại / Try again */}
            Thử lại / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
