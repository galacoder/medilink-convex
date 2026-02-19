"use client";

import { useRef } from "react";
import { Button } from "@medilink/ui/button";
import { Input } from "@medilink/ui/input";

/**
 * Manual equipment ID entry form — offline/no-camera fallback.
 *
 * WHY: Some devices may not have camera access (desktop browsers with
 * blocked camera permissions, older devices). This form lets users
 * manually enter an equipment ID to navigate to the equipment detail page.
 *
 * Props:
 *   onSubmit - Callback with the entered equipment ID string
 *
 * vi: "Nhập thủ công ID thiết bị" / en: "Manual equipment ID entry"
 */

interface QROfflineFallbackProps {
  onSubmit: (equipmentId: string) => void;
}

export function QROfflineFallback({ onSubmit }: QROfflineFallbackProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (value) {
      onSubmit(value);
    }
  };

  return (
    <div
      className="flex w-full flex-col gap-4 rounded-lg border p-6"
      data-testid="qr-fallback-container"
    >
      {/* vi: "Nhập thủ công" / en: "Manual Entry" */}
      <div>
        <h3 className="text-sm font-semibold">
          Nhập thủ công {/* Manual Entry */}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {/* vi: "Nhập ID thiết bị nếu không thể quét mã QR" */}
          {/* en: "Enter equipment ID if QR scanning is unavailable" */}
          Nhập ID thiết bị nếu không thể quét mã QR{" "}
          {/* Enter equipment ID if QR scanning is unavailable */}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Nhập ID thiết bị... (Enter Equipment ID...)"
          aria-label="ID thiết bị" // Equipment ID
          data-testid="qr-fallback-input"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <Button
          type="submit"
          data-testid="qr-fallback-submit"
        >
          {/* vi: "Tìm thiết bị" / en: "Find Equipment" */}
          Tìm thiết bị {/* Find Equipment */}
        </Button>
      </form>
    </div>
  );
}
