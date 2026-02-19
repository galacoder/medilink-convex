/**
 * Loading skeleton for the QR scanner page.
 *
 * WHY: The scanner page is a client component that dynamically imports
 * html5-qrcode. This skeleton prevents layout shift and gives users
 * visual feedback while the camera library loads.
 *
 * vi: "Màn hình tải trang quét mã QR" / en: "QR scanner page loading skeleton"
 */

export default function HospitalScanLoading() {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Page header skeleton */}
      <div className="w-full space-y-2">
        <div className="bg-muted h-7 w-40 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </div>

      {/* Camera viewport placeholder */}
      <div
        className="bg-muted w-full max-w-sm animate-pulse rounded-lg"
        style={{ minHeight: "300px" }}
        aria-label="Đang tải camera... (Loading camera...)"
        role="status"
      >
        {/* Center a camera icon placeholder */}
        <div className="flex h-full min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            {/* Camera icon placeholder */}
            <div className="bg-muted-foreground/20 h-16 w-16 rounded-full" />
            <p className="text-muted-foreground text-sm">
              {/* vi: "Đang tải camera..." / en: "Loading camera..." */}
              Đang tải camera... {/* Loading camera... */}
            </p>
          </div>
        </div>
      </div>

      {/* Button placeholder */}
      <div className="bg-muted h-9 w-36 animate-pulse rounded" />
    </div>
  );
}
