"use client";

import type { FunctionReference } from "convex/server";
import { useMutation, useQuery } from "convex/react";

import { api } from "@medilink/backend";

// Cast via (api as any) until `npx convex dev` regenerates types.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
const photosApi = (api as any).consumablePhotos;
type QueryRef = FunctionReference<"query">;
type MutationRef = FunctionReference<"mutation">;
const listPhotosFn: QueryRef = photosApi.listPhotos;
const savePhotoFn: MutationRef = photosApi.savePhoto;
const deletePhotoFn: MutationRef = photosApi.deletePhoto;
const generateUploadUrlFn: MutationRef = photosApi.generateUploadUrl;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/** Photo record shape returned by listPhotos query */
export interface ConsumablePhoto {
  _id: string;
  _creationTime: number;
  consumableId: string;
  organizationId: string;
  storageId: string;
  fileName: string;
  uploadedBy: string;
  createdAt: number;
  updatedAt: number;
  url: string | null;
}

/** Max file size: 5 MB */
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed MIME types for consumable photos */
export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * Hook for consumable photo CRUD operations.
 *
 * WHY: Wraps Convex action (generateUploadUrl), mutations (savePhoto,
 * deletePhoto) and query (listPhotos) so the photo upload/gallery
 * components don't need to know about Convex internals.
 *
 * vi: "Hook anh vat tu tieu hao" / en: "Consumable photos hook"
 */
export function useConsumablePhotos(consumableId: string | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const photos = useQuery(
    listPhotosFn,
    consumableId ? { consumableId } : "skip",
  );
  const savePhoto = useMutation(savePhotoFn);
  const deletePhoto = useMutation(deletePhotoFn);
  const generateUploadUrl = useMutation(generateUploadUrlFn);

  /**
   * Upload a file to Convex storage and save the photo record.
   *
   * Flow:
   *  1. Get pre-signed URL from Convex
   *  2. Upload file directly to storage
   *  3. Save photo record linking storageId to consumableId
   */
  async function uploadPhoto(
    file: File,
  ): Promise<{ photoId: string; url: string | null }> {
    if (!consumableId) {
      throw new Error(
        "Khong co consumableId de tai anh len. (No consumableId for upload.)",
      );
    }

    // Validate file type
    if (
      !ALLOWED_PHOTO_TYPES.includes(
        file.type as (typeof ALLOWED_PHOTO_TYPES)[number],
      )
    ) {
      throw new Error(
        "Loai tep khong hop le. Chi chap nhan JPEG, PNG, WebP. (Invalid file type. Only JPEG, PNG, WebP accepted.)",
      );
    }

    // Validate file size
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      throw new Error("Kich thuoc tep vuot qua 5MB. (File size exceeds 5MB.)");
    }

    // 1. Get pre-signed upload URL
    const uploadUrl = (await generateUploadUrl({})) as string;

    // 2. Upload file
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Tai anh len that bai. (Upload failed.)");
    }

    const { storageId } = (await uploadResponse.json()) as {
      storageId: string;
    };

    // 3. Save photo record
    const result = (await savePhoto({
      consumableId,
      storageId,
      fileName: file.name,
    })) as { photoId: string; url: string | null };

    return result;
  }

  return {
    photos: (photos ?? []) as ConsumablePhoto[],
    isLoading: photos === undefined,
    uploadPhoto,
    deletePhoto,
  };
}
