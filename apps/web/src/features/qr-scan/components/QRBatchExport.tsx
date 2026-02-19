"use client";

import { useState } from "react";

import { Button } from "@medilink/ui/button";

/**
 * Batch QR code generation and print export for an equipment category.
 *
 * WHY: Staff need to print QR code labels for all equipment in a category
 * at once (e.g., all diagnostic devices before a training session).
 * This component triggers batch generation and renders a print-friendly grid.
 *
 * Props:
 *   categoryId - Convex category ID to generate QR codes for
 *   categoryName - Display name for the category
 *   onBatchGenerate - Async callback that triggers the batchGenerateQRCodes mutation
 *
 * vi: "Tạo hàng loạt và xuất mã QR" / en: "Batch generate and export QR codes"
 */

interface BatchResult {
  generated: number;
  skipped: number;
}

interface QRBatchExportProps {
  categoryId: string;
  categoryName?: string;
  onBatchGenerate: (categoryId: string) => Promise<BatchResult>;
}

type BatchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: BatchResult }
  | { status: "error"; message: string };

export function QRBatchExport({
  categoryId,
  categoryName,
  onBatchGenerate,
}: QRBatchExportProps) {
  const [batchState, setBatchState] = useState<BatchState>({ status: "idle" });

  const handleGenerate = async () => {
    setBatchState({ status: "loading" });
    try {
      const result = await onBatchGenerate(categoryId);
      setBatchState({ status: "done", result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setBatchState({
        status: "error",
        // vi: "Lỗi tạo mã QR hàng loạt" / en: "Batch generation error"
        message: `Lỗi tạo mã QR: ${message} (Batch generation error: ${message})`,
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="flex flex-col gap-4 rounded-lg border p-6"
      data-testid="qr-batch-export"
    >
      {/* vi: "Tạo hàng loạt mã QR" / en: "Batch QR Code Generation" */}
      <div>
        <h3 className="text-sm font-semibold">
          Tạo hàng loạt mã QR {/* Batch QR Code Generation */}
        </h3>
        {categoryName && (
          <p className="text-muted-foreground mt-1 text-xs">
            {/* vi: "Danh mục" / en: "Category" */}
            Danh mục: {categoryName} {/* Category: */}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => void handleGenerate()}
          disabled={batchState.status === "loading"}
          data-testid="qr-batch-generate"
        >
          {batchState.status === "loading"
            ? "Đang tạo... (Generating...)"
            : "Tạo mã QR (Generate QR Codes)"}
        </Button>

        {batchState.status === "done" && (
          <Button
            variant="outline"
            onClick={handlePrint}
            data-testid="qr-batch-print"
          >
            {/* vi: "In mã QR" / en: "Print QR Codes" */}
            In mã QR {/* Print QR Codes */}
          </Button>
        )}
      </div>

      {/* Result summary */}
      {batchState.status === "done" && (
        <div
          className="bg-muted rounded p-3 text-sm"
          data-testid="qr-batch-result"
        >
          {/* vi: "Đã tạo X mã QR, bỏ qua Y (đã có)" */}
          {/* en: "Generated X QR codes, skipped Y (already exist)" */}
          <p>
            Đã tạo: <strong>{batchState.result.generated}</strong> mã QR{" "}
            {/* Generated: X QR codes */}
          </p>
          <p>
            Bỏ qua: <strong>{batchState.result.skipped}</strong> (đã có mã QR){" "}
            {/* Skipped: Y (already have QR codes) */}
          </p>
        </div>
      )}

      {batchState.status === "error" && (
        <div
          className="text-destructive rounded p-3 text-sm"
          data-testid="qr-batch-error"
          role="alert"
        >
          {batchState.message}
        </div>
      )}
    </div>
  );
}
