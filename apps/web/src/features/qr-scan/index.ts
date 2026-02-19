/**
 * QR Scan feature module barrel export.
 *
 * WHY: Centralizes all QR scan public API so that pages and other features
 * only need to import from "@/features/qr-scan" instead of individual files.
 *
 * vi: "Xuất module quét mã QR" / en: "QR scan feature module exports"
 */

export { QRCodeDisplay } from "./components/QRCodeDisplay";
export { QRScanner } from "./components/QRScanner";
export { QROfflineFallback } from "./components/QROfflineFallback";
export { QRBatchExport } from "./components/QRBatchExport";
export { useQRScanner } from "./hooks/useQRScanner";
