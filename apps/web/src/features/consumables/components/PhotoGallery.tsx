"use client";

import { useState } from "react";
import { TrashIcon, XIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@medilink/ui/dialog";
import { Skeleton } from "@medilink/ui/skeleton";

import type { ConsumablePhoto } from "../hooks/useConsumablePhotos";

interface PhotoGalleryProps {
  photos: ConsumablePhoto[];
  isLoading?: boolean;
  onDelete?: (photoId: string) => Promise<void>;
}

/**
 * Grid gallery for consumable photos with lightbox and delete.
 *
 * WHY: Displays uploaded consumable photos in a responsive grid.
 * Clicking a photo opens a lightbox dialog. Delete button allows
 * removing photos (with confirmation via the lightbox).
 *
 * vi: "Thu vien anh vat tu tieu hao" / en: "Consumable photo gallery"
 */
export function PhotoGallery({
  photos,
  isLoading = false,
  onDelete,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ConsumablePhoto | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(photoId: string) {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(photoId);
      setSelectedPhoto(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    );
  }

  // Empty state
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-8 text-center">
        <p className="text-muted-foreground text-sm">
          Chua co anh nao. (No photos yet.)
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <button
            key={photo._id}
            type="button"
            className="group relative aspect-square overflow-hidden rounded-md border focus:ring-2 focus:ring-offset-2 focus:outline-none"
            onClick={() => setSelectedPhoto(photo)}
          >
            {photo.url ? (
              // Using regular img tag since these are Convex storage URLs
              // that are not statically analyzable for next/image optimization
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.url}
                alt={photo.fileName}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <span className="text-muted-foreground text-xs">
                  Khong tai duoc
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </button>
        ))}
      </div>

      {/* Lightbox dialog */}
      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPhoto(null);
        }}
      >
        <DialogContent className="max-w-2xl p-0">
          <DialogTitle className="sr-only">
            {selectedPhoto?.fileName ?? "Anh vat tu"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Xem anh chi tiet (Photo detail view)
          </DialogDescription>
          {selectedPhoto && (
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setSelectedPhoto(null)}
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Dong (Close)</span>
              </Button>

              {/* Image */}
              {selectedPhoto.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.fileName}
                  className="h-auto max-h-[80vh] w-full object-contain"
                />
              ) : (
                <div className="bg-muted flex h-64 items-center justify-center">
                  <span className="text-muted-foreground">
                    Khong tai duoc anh (Cannot load image)
                  </span>
                </div>
              )}

              {/* Footer with file name and delete */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-muted-foreground max-w-[60%] truncate text-sm">
                  {selectedPhoto.fileName}
                </span>
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => void handleDelete(selectedPhoto._id)}
                  >
                    <TrashIcon className="mr-1 h-4 w-4" />
                    {isDeleting ? "Dang xoa..." : "Xoa (Delete)"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
