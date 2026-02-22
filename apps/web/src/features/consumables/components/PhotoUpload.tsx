"use client";

import { useCallback, useRef, useState } from "react";
import { UploadIcon, XIcon } from "lucide-react";

import { cn } from "@medilink/ui";

import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_SIZE_BYTES,
} from "../hooks/useConsumablePhotos";

interface PhotoUploadProps {
  /** Called when a file is ready to upload */
  onUpload: (file: File) => Promise<void>;
  /** Whether an upload is currently in progress */
  isUploading?: boolean;
  /** Additional class names for the drop zone */
  className?: string;
}

/**
 * Drag-and-drop photo upload component for consumable items.
 *
 * WHY: Consumables need photo documentation for inventory management.
 * This component provides a drop zone with click-to-upload fallback,
 * validates file type and size before triggering the upload callback.
 *
 * Validates:
 * - File types: JPEG, PNG, WebP
 * - Max size: 5MB
 *
 * vi: "Tai anh vat tu tieu hao" / en: "Consumable photo upload"
 */
export function PhotoUpload({
  onUpload,
  isUploading = false,
  className,
}: PhotoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (
      !ALLOWED_PHOTO_TYPES.includes(
        file.type as (typeof ALLOWED_PHOTO_TYPES)[number],
      )
    ) {
      return "Loai tep khong hop le. Chi chap nhan JPEG, PNG, WebP. (Invalid file type. Only JPEG, PNG, WebP accepted.)";
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return "Kich thuoc tep vuot qua 5MB. (File size exceeds 5MB.)";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      try {
        await onUpload(file);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Tai anh len that bai. (Upload failed.)";
        setError(msg);
      }
    },
    [onUpload, validateFile],
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    // Reset the input so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Tai anh len (Upload photo)"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-50",
          className,
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <UploadIcon className="text-muted-foreground mb-2 h-8 w-8" />
        <p className="text-muted-foreground text-sm">
          {isUploading
            ? "Dang tai len... (Uploading...)"
            : "Keo tha hoac nhan de chon anh (Drag & drop or click to select)"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          JPEG, PNG, WebP - toi da 5MB (max 5MB)
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />

      {error && (
        <div className="flex items-start gap-2 text-sm">
          <XIcon className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
