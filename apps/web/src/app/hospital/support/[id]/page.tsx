"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";

import { TicketDetail } from "~/features/support/components/ticket-detail";
import { useSupportDetail } from "~/features/support/hooks/use-support-detail";
import { supportLabels } from "~/features/support/labels";

/**
 * Hospital support ticket detail page.
 *
 * WHY: Shows full ticket info with message thread for communication.
 * Real-time updates via Convex subscription.
 *
 * vi: "Chi tiet phieu ho tro benh vien" / en: "Hospital support ticket detail"
 */
export default function HospitalSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ticket, isLoading } = useSupportDetail(id);

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link href="/hospital/support">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            {supportLabels.backToList.vi}
          </Button>
        </Link>
      </div>

      <TicketDetail ticket={ticket} isLoading={isLoading} />
    </div>
  );
}
