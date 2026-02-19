"use client";

/**
 * Platform admin escalated disputes queue page.
 *
 * Shows all disputes that have been escalated by hospitals for platform
 * arbitration. Platform admins can click through to the dispute detail
 * page to review evidence and submit a ruling.
 *
 * vi: "Trang hàng đợi tranh chấp leo thang" / en: "Escalated disputes queue page"
 */
import { GavelIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { EscalatedDispute } from "~/features/admin-disputes";
import {
  adminDisputeLabels,
  EscalatedDisputeTable,
  useEscalatedDisputes,
} from "~/features/admin-disputes";

/**
 * Escalated disputes queue for platform admin arbitration.
 *
 * WHY: Escalated disputes are separated from the main service request view
 * because they require a specific arbitration workflow. Admins need to see
 * only the disputes requiring their intervention, not all disputes system-wide.
 */
export default function AdminDisputesPage() {
  const escalatedDisputes = useEscalatedDisputes();
  const isLoading = escalatedDisputes === undefined;

  const disputes: EscalatedDispute[] = escalatedDisputes ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <GavelIcon className="h-6 w-6" />
          {adminDisputeLabels.titles.escalatedDisputes.vi}
          {/* Escalated Disputes */}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Các tranh chấp cần can thiệp của quản trị viên nền tảng
          {/* Disputes requiring platform admin intervention */}
        </p>
      </div>

      {/* Stats card */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>
            Chờ trọng tài {/* Awaiting arbitration */}
          </CardDescription>
          <CardTitle className="text-3xl text-red-600">
            {isLoading ? "—" : disputes.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">
            Tranh chấp leo thang từ bệnh viện{" "}
            {/* Disputes escalated by hospitals */}
          </p>
        </CardContent>
      </Card>

      {/* Escalated disputes table */}
      <EscalatedDisputeTable disputes={disputes} isLoading={isLoading} />
    </div>
  );
}
