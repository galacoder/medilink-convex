"use client";

import { useActiveOrganization } from "~/auth/client";

/**
 * Hospital service requests list page — scaffold with data-testid attributes for E2E tests.
 *
 * WHY: E2E tests (Wave 5) need a visible list container at /hospital/service-requests
 * with `data-testid="service-request-list"` for assertions. Full Convex integration
 * (via api.serviceRequests.listByHospital) will be added in M2.
 *
 * vi: "Yêu cầu dịch vụ" / en: "Service Requests"
 */
export default function HospitalServiceRequestsPage() {
  const { data: _activeOrg, isPending } = useActiveOrganization();

  return (
    <div className="space-y-6">
      {/* Page heading — vi: "Yêu cầu dịch vụ" / en: "Service Requests" */}
      <div>
        <h1 className="text-2xl font-semibold">
          Yêu cầu dịch vụ {/* Service Requests */}
        </h1>
        <p className="text-muted-foreground mt-1">
          Danh sách yêu cầu sửa chữa và bảo dưỡng thiết bị{" "}
          {/* Equipment repair and maintenance requests */}
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
        // assert data-testid="service-request-list" is visible without waiting for data.
        <div className="overflow-hidden rounded-lg border">
          <table
            className="w-full text-sm"
            data-testid="service-request-list"
            aria-label="Danh sách yêu cầu dịch vụ"
          >
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  Loại yêu cầu {/* Request Type */}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Trạng thái {/* Status */}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Mức độ ưu tiên {/* Priority */}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Thiết bị {/* Equipment */}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Ngày tạo {/* Created Date */}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Service request rows rendered by Convex query (M2 integration) */}
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground px-4 py-8 text-center text-sm"
                >
                  Chưa có yêu cầu dịch vụ nào {/* No service requests yet */}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
