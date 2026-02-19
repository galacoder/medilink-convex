import { z } from "zod/v4";

/**
 * QR scan action enum.
 * vi: "Hành động quét mã QR" / en: "QR scan action"
 *   view         - vi: "Xem"       / en: "View"
 *   borrow       - vi: "Mượn"      / en: "Borrow"
 *   return       - vi: "Trả"       / en: "Return"
 *   report_issue - vi: "Báo sự cố" / en: "Report issue"
 */
export const qrScanActionSchema = z.enum([
  "view",
  "borrow",
  "return",
  "report_issue",
]);

/**
 * Schema for generating a QR code for a single equipment item.
 * vi: "Tạo mã QR cho thiết bị" / en: "Generate QR code for equipment"
 */
export const generateQRCodeSchema = z.object({
  equipmentId: z.string().min(1, {
    message: "ID thiết bị không được để trống (Equipment ID is required)",
  }),
});

/**
 * Schema for recording a QR code scan event.
 * vi: "Ghi lại sự kiện quét mã QR" / en: "Record QR code scan event"
 */
export const recordScanSchema = z.object({
  qrCodeId: z.string().min(1, {
    message: "ID mã QR không được để trống (QR Code ID is required)",
  }),
  action: qrScanActionSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for batch generating QR codes for an entire equipment category.
 * vi: "Tạo hàng loạt mã QR cho danh mục" / en: "Batch generate QR codes for category"
 */
export const batchGenerateSchema = z.object({
  categoryId: z.string().min(1, {
    message: "ID danh mục không được để trống (Category ID is required)",
  }),
});

// TypeScript type inference exports
export type QrScanAction = z.infer<typeof qrScanActionSchema>;
export type GenerateQRCodeInput = z.infer<typeof generateQRCodeSchema>;
export type RecordScanInput = z.infer<typeof recordScanSchema>;
export type BatchGenerateInput = z.infer<typeof batchGenerateSchema>;
