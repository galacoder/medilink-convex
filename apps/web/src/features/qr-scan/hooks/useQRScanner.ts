"use client";

import type { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Custom hook for managing the html5-qrcode scanner lifecycle.
 *
 * WHY: Encapsulates the complex camera API initialization, permission
 * handling, decode callbacks, and cleanup logic so that multiple
 * components can use the scanner without duplicating lifecycle code.
 *
 * vi: "Hook quản lý vòng đời máy quét QR" / en: "QR scanner lifecycle hook"
 */

interface QRScannerState {
  isScanning: boolean;
  error: string | null;
  lastResult: string | null;
}

interface UseQRScannerReturn extends QRScannerState {
  startScan: (onResult: (result: string) => void) => Promise<void>;
  stopScan: () => Promise<void>;
}

export function useQRScanner(elementId: string): UseQRScannerReturn {
  const [state, setState] = useState<QRScannerState>({
    isScanning: false,
    error: null,
    lastResult: null,
  });

  // Store scanner instance in a ref to avoid re-renders.
  // WHY: Using the imported Html5Qrcode type (type-only import) gives proper
  // typing for .stop(), .clear(), .start() calls without triggering
  // @typescript-eslint/no-unsafe-call or no-unsafe-member-access errors.
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScan = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore errors when stopping — scanner may already be stopped
      } finally {
        scannerRef.current = null;
        setState((prev) => ({ ...prev, isScanning: false }));
      }
    }
  }, []);

  const startScan = useCallback(
    async (onResult: (result: string) => void) => {
      // Avoid re-initializing if already scanning
      if (scannerRef.current) {
        return;
      }

      setState({ isScanning: false, error: null, lastResult: null });

      try {
        // Dynamically import html5-qrcode to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode");

        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          // vi: "Vùng quét" / en: "Scan area"
          qrbox: { width: 250, height: 250 },
        };

        await html5QrCode.start(
          { facingMode: "environment" }, // Back camera preferred on mobile
          config,
          (decodedText: string) => {
            setState((prev) => ({ ...prev, lastResult: decodedText }));
            onResult(decodedText);
          },
          undefined, // Suppress verbose decode failure logs
        );

        setState((prev) => ({ ...prev, isScanning: true }));
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Camera access failed";

        let errorMessage: string;

        if (
          message.includes("Permission denied") ||
          message.includes("NotAllowedError")
        ) {
          // vi: "Bị từ chối quyền camera" / en: "Camera permission denied"
          errorMessage =
            "Không có quyền truy cập camera. Vui lòng cấp quyền và thử lại. (Camera permission denied. Please grant access and try again.)";
        } else if (
          message.includes("NotFoundError") ||
          message.includes("no camera")
        ) {
          // vi: "Không tìm thấy camera" / en: "No camera found"
          errorMessage =
            "Không tìm thấy camera trên thiết bị này. (No camera found on this device.)";
        } else {
          // vi: "Lỗi camera" / en: "Camera error"
          errorMessage = `Lỗi camera: ${message} (Camera error: ${message})`;
        }

        scannerRef.current = null;
        setState({ isScanning: false, error: errorMessage, lastResult: null });
      }
    },
    [elementId],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void stopScan();
    };
  }, [stopScan]);

  return {
    isScanning: state.isScanning,
    error: state.error,
    lastResult: state.lastResult,
    startScan,
    stopScan,
  };
}
