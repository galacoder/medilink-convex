"use client";

import { useEffect, useId } from "react";
import { Button } from "@medilink/ui/button";
import { useQRScanner } from "../hooks/useQRScanner";

/**
 * Camera-based QR code scanner component.
 *
 * WHY: Mobile users need to scan physical QR codes on equipment without
 * manually searching for equipment IDs. This component provides a
 * full-screen camera view optimized for mobile with large touch targets.
 *
 * On decode success, calls onScan with the decoded QR code string.
 * Falls back gracefully on permission denial or no camera detected.
 *
 * Props:
 *   onScan - Callback with decoded QR code string
 *   onError - Optional callback with user-friendly error message
 *
 * vi: "Máy quét mã QR bằng camera" / en: "Camera-based QR scanner"
 */

interface QRScannerProps {
  onScan: (code: string) => void;
  onError?: (err: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  // Use a unique ID per instance to support multiple scanners on a page
  const instanceId = useId().replace(/:/g, "-");
  const scannerId = `qr-scanner-preview-${instanceId}`;

  const { isScanning, error, startScan, stopScan } = useQRScanner(scannerId);

  // Auto-start scanning on mount
  useEffect(() => {
    void startScan(onScan);
    return () => {
      void stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  // Propagate errors to parent if handler provided
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <div
      className="relative flex w-full flex-col items-center gap-4"
      data-testid="qr-scanner-container"
    >
      {/* Camera viewport — html5-qrcode renders into this div */}
      <div
        id={scannerId}
        className="w-full max-w-sm overflow-hidden rounded-lg border"
        style={{ minHeight: "300px" }}
        data-testid="qr-scanner-preview"
        aria-label="Khu vực quét camera" // Camera scan area
      />

      {/* Status indicators */}
      {!isScanning && !error && (
        <p className="text-muted-foreground text-sm">
          {/* vi: "Đang khởi động camera..." / en: "Starting camera..." */}
          Đang khởi động camera... {/* Starting camera... */}
        </p>
      )}

      {isScanning && (
        <p className="text-sm font-medium text-green-600">
          {/* vi: "Camera đang hoạt động — hãy hướng về phía mã QR" */}
          {/* en: "Camera active — point at a QR code" */}
          Camera đang hoạt động — hãy hướng về phía mã QR{" "}
          {/* Camera active — point at a QR code */}
        </p>
      )}

      {error && (
        <div
          className="bg-destructive/10 text-destructive w-full rounded-lg p-4 text-sm"
          data-testid="qr-scanner-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Stop button — shown when camera is active */}
      {isScanning && (
        <Button
          variant="outline"
          onClick={() => void stopScan()}
          data-testid="qr-scanner-stop"
        >
          {/* vi: "Dừng quét" / en: "Stop scanning" */}
          Dừng quét {/* Stop scanning */}
        </Button>
      )}
    </div>
  );
}
