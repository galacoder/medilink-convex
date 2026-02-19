"use client";

import { useActiveOrganization } from "~/auth/client";

/**
 * Provider service requests page — scaffold with data-testid attributes for E2E tests.
 *
 * WHY: E2E tests (Wave 5) need a visible list container at /provider/service-requests
 * with `data-testid="provider-request-list"` for assertions. Full Convex integration
 * (via api.serviceRequests.listByProvider) will be added in M2.
 *
 * Providers see service requests assigned to them or available for quoting.
 *
 * vi: "Yêu cầu dịch vụ từ bệnh viện" / en: "Hospital Service Requests"
 */
export default function ProviderServiceRequestsPage() {
  const { data: _activeOrg, isPending } = useActiveOrganization();

  return (
    <div className="space-y-6">
      {/* Page heading — vi: "Yêu cầu dịch vụ" / en: "Service Requests" */}
      <div>
        <h1 className="text-2xl font-semibold">
          Yêu cầu dịch vụ {/* Service Requests */}
        </h1>
        <p className="text-muted-foreground mt-1">
          Yêu cầu dịch vụ từ các bệnh viện {/* Service requests from hospitals */}
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
        // assert data-testid="provider-request-list" is visible without waiting for data.
        <div className="overflow-hidden rounded-lg border">
          <table
            className="w-full text-sm"
            data-testid="provider-request-list"
            aria-label="Danh sách yêu cầu dịch vụ từ bệnh viện"
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
                  Tên bệnh viện {/* Hospital Name */}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Mức độ ưu tiên {/* Priority */}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Ngày tạo {/* Created Date */}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Provider request rows rendered by Convex query (M2 integration) */}
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
