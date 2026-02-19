"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Badge } from "@medilink/ui/badge";
import { Button } from "@medilink/ui/button";

import { QRCodeDisplay } from "~/features/qr-scan";

/**
 * Equipment detail page at /hospital/equipment/[id].
 *
 * WHY: After scanning a QR code (or clicking from the equipment list),
 * staff need to see full equipment details and have access to the QR code
 * for downloading/printing additional labels.
 *
 * This page displays:
 *   - Equipment name (bilingual), status badge, condition, location
 *   - QRCodeDisplay component for viewing/downloading the QR code
 *   - Back navigation to equipment list
 *
 * NOTE: This scaffold renders with static content while Convex integration
 * (api.equipment.getById + api.qrCodes.getByEquipmentId) is added in M3
 * once convex dev generates types.
 *
 * vi: "Chi tiết thiết bị y tế" / en: "Medical Equipment Detail"
 */

// Status badge color mapping
const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  available: "default",
  in_use: "secondary",
  maintenance: "outline",
  damaged: "destructive",
  retired: "outline",
};

// Bilingual status labels
const STATUS_LABELS: Record<string, { vi: string; en: string }> = {
  available: { vi: "Sẵn sàng", en: "Available" },
  in_use: { vi: "Đang sử dụng", en: "In Use" },
  maintenance: { vi: "Bảo trì", en: "Maintenance" },
  damaged: { vi: "Hỏng", en: "Damaged" },
  retired: { vi: "Đã nghỉ hưu", en: "Retired" },
};

// Bilingual condition labels
const CONDITION_LABELS: Record<string, { vi: string; en: string }> = {
  excellent: { vi: "Xuất sắc", en: "Excellent" },
  good: { vi: "Tốt", en: "Good" },
  fair: { vi: "Trung bình", en: "Fair" },
  poor: { vi: "Kém", en: "Poor" },
};

export default function HospitalEquipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const equipmentId = params.id;

  // TODO (M3): Replace with Convex query once convex dev generates types:
  // const equipment = useQuery(api.equipment.getById, { id: equipmentId as Id<"equipment"> });
  // const qrCode = useQuery(api.qrCodes.getByEquipmentId, { equipmentId: equipmentId as Id<"equipment"> });

  // Scaffold: show equipment ID-based placeholder content
  // Full equipment data will come from Convex queries in M3 integration
  const mockStatus = "available";
  const mockCondition = "good";

  return (
    <div className="space-y-6" data-testid="equipment-detail">
      {/* Back navigation */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/hospital/equipment" data-testid="equipment-detail-back">
            {/* vi: "Quay lại danh sách" / en: "Back to list" */}← Quay lại danh
            sách {/* ← Back to list */}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Equipment info — left 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Equipment header */}
          <div className="rounded-lg border p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1
                  className="text-2xl font-semibold"
                  data-testid="equipment-name-vi"
                >
                  {/* vi: "Tên thiết bị" / en: "Equipment name" */}
                  Thiết bị #{equipmentId.slice(-8)}{" "}
                  {/* Equipment #[short ID] */}
                </h1>
                <p
                  className="text-muted-foreground mt-1"
                  data-testid="equipment-name-en"
                >
                  Equipment #{equipmentId.slice(-8)}
                </p>
              </div>

              <Badge
                variant={STATUS_COLORS[mockStatus] ?? "default"}
                data-testid="equipment-status-badge"
              >
                {STATUS_LABELS[mockStatus]?.vi ?? mockStatus}{" "}
                {/* Vietnamese status label */}
              </Badge>
            </div>

            {/* Equipment metadata */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">
                  {/* vi: "Tình trạng" / en: "Condition" */}
                  Tình trạng {/* Condition */}
                </p>
                <p
                  className="mt-1 font-medium"
                  data-testid="equipment-condition"
                >
                  {CONDITION_LABELS[mockCondition]?.vi ?? mockCondition}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">
                  {/* vi: "Vị trí" / en: "Location" */}
                  Vị trí {/* Location */}
                </p>
                <p
                  className="mt-1 font-medium"
                  data-testid="equipment-location"
                >
                  {/* Placeholder — will be filled from Convex data */}
                  Chưa cập nhật {/* Not yet updated */}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">
                  {/* vi: "Số sê-ri" / en: "Serial Number" */}
                  Số sê-ri {/* Serial Number */}
                </p>
                <p className="mt-1 font-medium" data-testid="equipment-serial">
                  Chưa cập nhật {/* Not yet updated */}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">
                  {/* vi: "ID thiết bị" / en: "Equipment ID" */}
                  ID thiết bị {/* Equipment ID */}
                </p>
                <p
                  className="mt-1 font-mono text-xs"
                  data-testid="equipment-id"
                >
                  {equipmentId}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code panel — right 1/3 */}
        <div className="lg:col-span-1">
          {/* QRCodeDisplay renders the QR code with download button */}
          {/* Will use qrCode.code from Convex query in M3 */}
          <QRCodeDisplay
            equipmentId={equipmentId}
            equipmentName={`Thiết bị #${equipmentId.slice(-8)}`}
            qrCode={null}
          />
        </div>
      </div>
    </div>
  );
}
