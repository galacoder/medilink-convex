"use client";

/**
 * Hospital consumables list page.
 * Renders ConsumablesTable with bilingual headings at /hospital/consumables.
 *
 * WHY: Hospital staff need a centralized view of all consumable supplies
 * with stock status indicators and filter controls to quickly identify
 * items needing reorder.
 *
 * vi: "Trang danh sách vật tư tiêu hao" / en: "Consumables List Page"
 */
import { ConsumablesTable } from "~/features/consumables/components/ConsumablesTable";

export default function HospitalConsumablesPage() {
  return (
    <div className="space-y-6">
      {/* Page heading — vi: "Vật tư tiêu hao" / en: "Consumables" */}
      <div>
        <h1 className="text-2xl font-semibold">
          Vật tư tiêu hao {/* Consumables */}
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý vật tư và theo dõi tồn kho{" "}
          {/* Manage consumables and track stock */}
        </p>
      </div>

      {/* Main table with filters — data-testid set inside ConsumablesTable */}
      <ConsumablesTable locale="vi" />
    </div>
  );
}
