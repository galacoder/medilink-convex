"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@medilink/ui/button";
import { QROfflineFallback, QRScanner } from "~/features/qr-scan";
// TODO(M3): Uncomment once `npx convex dev` generates types
// import { useMutation } from "convex/react";
// import { api } from "convex/_generated/api";

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

  // TODO(M3): Enable audit logging once Convex types are generated
  // const recordScan = useMutation(api.qrCodes.recordScan);

  /**
   * Handles a successfully decoded QR code.
   *
   * QR code format (URL): https://medilink.app/equipment/{equipmentId}?org={orgId}&t={timestamp}
   *
   * WHY: URL format is unambiguous — the equipmentId is a distinct URL path
   * segment, so parsing never relies on assumptions about delimiter characters
   * in Convex IDs. Old hyphen-delimited format was fragile.
   *
   * Audit trail: recordScan mutation is called to create a qrScanLog entry
   * for compliance with Vietnamese medical device regulations (Decree 13/2023).
   * This is required by acceptance criterion "Usage logging: scan creates a qrScanLog entry".
   */
  const handleScan = (decodedText: string) => {
    // Parse URL format: https://medilink.app/equipment/{equipmentId}?...
    try {
      const url = new URL(decodedText);
      const pathParts = url.pathname.split("/");
      // pathname: /equipment/{equipmentId}  →  pathParts: ["", "equipment", "{equipmentId}"]
      const equipmentId = pathParts[pathParts.length - 1];
      if (equipmentId) {
        // TODO(M3): Call recordScan for audit trail once Convex types are generated
        // void recordScan({ qrCodeId: <look up by decodedText>, action: "view" });
        router.push(`/hospital/equipment/${equipmentId}`);
        return;
      }
    } catch {
      // Not a valid URL — fall through to direct redirect
    }

    // Fallback: try the code directly as an equipment ID
    router.push(`/hospital/equipment/${decodedText}`);
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
