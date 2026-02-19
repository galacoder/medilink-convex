"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@medilink/ui/button";

/**
 * Displays a QR code image for an equipment item with download functionality.
 *
 * WHY: Equipment staff need to print QR code labels to physically attach to
 * equipment. This component renders the QR code and provides a one-click
 * download so staff can save the image for label printing.
 *
 * Props:
 *   equipmentId - Convex equipment document ID (used as QR content)
 *   equipmentName - Display name shown below the QR code
 *   qrCode - QR code string value (unique code from qrCodes table)
 *
 * vi: "Hiển thị mã QR thiết bị" / en: "Equipment QR code display"
 */

interface QRCodeDisplayProps {
  equipmentId: string;
  equipmentName: string;
  qrCode: string | null;
}

export function QRCodeDisplay({
  equipmentId,
  equipmentName,
  qrCode,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQR = useCallback(async () => {
    if (!qrCode || !canvasRef.current) return;

    try {
      // Dynamically import qrcode to avoid SSR issues
      const QRCode = await import("qrcode");
      await QRCode.default.toCanvas(canvasRef.current, qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setIsGenerated(true);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(
        // vi: "Lỗi tạo mã QR" / en: "QR generation error"
        `Không thể tạo mã QR: ${message} (Failed to generate QR code: ${message})`,
      );
    }
  }, [qrCode]);

  useEffect(() => {
    void generateQR();
  }, [generateQR]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !isGenerated) return;

    const link = document.createElement("a");
    // Sanitize equipment name for filename
    const safeName = equipmentName.replace(/[^a-z0-9\-_]/gi, "-").toLowerCase();
    link.download = `qr-${safeName}-${equipmentId.slice(-8)}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }, [isGenerated, equipmentName, equipmentId]);

  if (!qrCode) {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-lg border p-6"
        data-testid="qr-code-display-empty"
      >
        <div className="text-muted-foreground text-sm">
          {/* vi: "Chưa có mã QR" / en: "No QR code yet" */}
          Chưa có mã QR. Vui lòng tạo mã QR cho thiết bị này.{" "}
          {/* No QR code yet. Please generate one for this equipment. */}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-lg border p-6"
      data-testid="qr-code-display"
    >
      {/* vi: "Mã QR" / en: "QR Code" */}
      <h3 className="text-sm font-medium">
        Mã QR {/* QR Code */}
      </h3>

      {error ? (
        <div className="text-destructive text-sm" data-testid="qr-code-error">
          {error}
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="rounded border"
          aria-label={`Mã QR cho thiết bị ${equipmentName}`}
          data-testid="qr-code-canvas"
        />
      )}

      <p className="text-muted-foreground max-w-[200px] text-center text-xs">
        {equipmentName}
      </p>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={!isGenerated || !!error}
        data-testid="qr-code-download"
      >
        {/* vi: "Tải xuống" / en: "Download" */}
        Tải xuống {/* Download */}
      </Button>
    </div>
  );
}
