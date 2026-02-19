"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@medilink/ui/button";
import { QROfflineFallback, QRScanner } from "~/features/qr-scan";

/**
 * Mobile-first QR code scanner page at /hospital/scan.
 *
 * WHY: This is the primary mobile entry point for hospital staff scanning
 * physical QR codes on equipment. The page provides:
 *   1. Camera-based QR scanning (primary UX for mobile users)
 *   2. Manual ID entry fallback (for desktop or camera permission denial)
 *
 * On successful scan, records the event via recordScan mutation and
 * redirects to /hospital/equipment/[id] for the scanned equipment.
 *
 * vi: "Trang quét mã QR" / en: "QR Code Scanner Page"
 */

export default function HospitalScanPage() {
  const router = useRouter();
  const [showManual, setShowManual] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  /**
   * Handles a successfully decoded QR code.
   * The code format is: `${organizationId}-${equipmentId}-${timestamp}`
   * We extract the equipmentId (middle segment) for the redirect.
   *
   * WHY: We store the full code in qrScanLog for audit purposes, but
   * we navigate using just the equipmentId for the detail page URL.
   */
  const handleScan = (code: string) => {
    // Extract equipmentId from code: orgId-equipmentId-timestamp
    // The equipmentId is a Convex ID (28-char alphanumeric)
    const parts = code.split("-");
    if (parts.length >= 2) {
      // The middle segment is the equipmentId
      // For Convex IDs that contain no "-", this is simply parts[1]
      // Handle multi-segment IDs by joining middle parts
      const equipmentId = parts.slice(1, -1).join("-");
      if (equipmentId) {
        router.push(`/hospital/equipment/${equipmentId}`);
        return;
      }
    }

    // If parsing fails, try the code directly as an equipment ID
    router.push(`/hospital/equipment/${code}`);
  };

  const handleManualSubmit = (equipmentId: string) => {
    router.push(`/hospital/equipment/${equipmentId}`);
  };

  const handleScanError = (err: string) => {
    setScanError(err);
    // Auto-switch to manual entry on camera failure
    setShowManual(true);
  };

  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center"
      data-testid="scan-page"
    >
      {/* Page header */}
      <div className="mb-6 w-full">
        <h1 className="text-2xl font-semibold">
          Quét mã QR {/* Scan QR Code */}
        </h1>
        <p className="text-muted-foreground mt-1">
          Hướng camera về phía mã QR trên thiết bị{" "}
          {/* Point camera at the QR code on the equipment */}
        </p>
      </div>

      {/* Toggle between camera and manual entry */}
      <div className="mb-4 flex w-full max-w-sm justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowManual((prev) => !prev)}
          data-testid="scan-toggle-manual"
        >
          {showManual
            ? "Dùng camera (Use Camera)"
            : "Nhập thủ công (Manual Entry)"}
        </Button>
      </div>

      <div className="w-full max-w-sm">
        {showManual ? (
          /* Manual entry fallback */
          <QROfflineFallback onSubmit={handleManualSubmit} />
        ) : (
          /* Camera scanner */
          <div className="flex flex-col gap-4">
            <QRScanner onScan={handleScan} onError={handleScanError} />

            {/* Show scan error if camera failed but user didn't switch to manual */}
            {scanError && (
              <div
                className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm"
                role="alert"
                data-testid="scan-error"
              >
                {scanError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-muted-foreground mt-6 max-w-sm text-center text-sm">
        {showManual ? (
          // vi: "Nhập ID thiết bị vào ô trên để tìm kiếm" / en: "Enter the equipment ID above to look it up"
          <p>Nhập ID thiết bị vào ô trên để tìm kiếm.</p>
        ) : (
          // vi: "Đặt điện thoại gần mã QR để quét tự động" / en: "Hold your phone near the QR code to scan automatically"
          <p>Đặt điện thoại gần mã QR để quét tự động.</p>
        )}
      </div>
    </div>
  );
}
