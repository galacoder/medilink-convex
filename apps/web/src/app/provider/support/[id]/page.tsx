"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";

import { TicketDetail } from "~/features/support/components/ticket-detail";
import { useSupportDetail } from "~/features/support/hooks/use-support-detail";
import { supportLabels } from "~/features/support/labels";

/**
 * Provider support ticket detail page.
 *
 * WHY: Shows full ticket info with message thread for communication.
 *
 * vi: "Chi tiet phieu ho tro nha cung cap" / en: "Provider support ticket detail"
 */
export default function ProviderSupportDetailPage({
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
        <Link href="/provider/support">
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
