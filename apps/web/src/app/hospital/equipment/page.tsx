"use client";

import { useActiveOrganization } from "~/auth/client";

/**
 * Hospital equipment list page — scaffold with data-testid attributes for E2E tests.
 *
 * WHY: E2E tests (Wave 5) need a visible list container at /hospital/equipment
 * with `data-testid="equipment-list"` for assertions. Full Convex integration
 * (via api.equipment.list) will be added in M2 once convex dev generates types.
 *
 * The list container renders immediately (empty state) so tests can assert
 * its visibility without depending on Convex query results.
 *
 * vi: "Danh sách thiết bị y tế" / en: "Medical Equipment List"
 */
export default function HospitalEquipmentPage() {
  const { data: activeOrg, isPending } = useActiveOrganization();

  return (
    <div className="space-y-6">
      {/* Page heading — vi: "Thiết bị y tế" / en: "Medical Equipment" */}
      <div>
        <h1 className="text-2xl font-semibold">
          Thiết bị y tế {/* Medical Equipment */}
        </h1>
        <p className="text-muted-foreground mt-1">
          Danh sách thiết bị của tổ chức {/* Organization equipment list */}
        </p>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-12 animate-pulse rounded" />
          ))}
        </div>
      ) : (
        // WHY: The table is always rendered (even empty) so E2E tests can
        // assert data-testid="equipment-list" is visible without waiting for data.
        // Equipment rows will appear here once M2 adds the Convex query integration.
        <div className="overflow-hidden rounded-lg border">
          <table
            className="w-full text-sm"
            data-testid="equipment-list"
            aria-label="Danh sách thiết bị"
          >
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  Tên thiết bị {/* Equipment Name */}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Tên (EN) {/* Name (EN) */}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Trạng thái {/* Status */}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Tình trạng {/* Condition */}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Equipment rows rendered by Convex query (M2 integration) */}
              {activeOrg === null && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-muted-foreground px-4 py-8 text-center text-sm"
                  >
                    Chưa có thiết bị nào {/* No equipment yet */}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
