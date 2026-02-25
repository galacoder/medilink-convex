"use client";

import { useState } from "react";
import { LifeBuoyIcon, PlusIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@medilink/ui/dialog";

import { TicketForm } from "~/features/support/components/ticket-form";
import { TicketList } from "~/features/support/components/ticket-list";
import { useSupportTickets } from "~/features/support/hooks/use-support-tickets";
import { supportLabels } from "~/features/support/labels";

/**
 * Hospital support ticket list page.
 *
 * WHY: Hospital staff create and track support tickets here.
 * Uses real-time Convex subscription for live updates.
 *
 * vi: "Trang ho tro benh vien" / en: "Hospital support page"
 */
export default function HospitalSupportPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { tickets, isLoading } = useSupportTickets();

  function handleCreated() {
    setIsCreateOpen(false);
  }

  return (
    <div className="space-y-6" data-testid="hospital-support">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            <LifeBuoyIcon className="mr-2 inline-block h-6 w-6" />
            {supportLabels.title.vi}{" "}
            <span className="text-muted-foreground text-base font-normal">
              ({supportLabels.title.en})
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {supportLabels.subtitle.vi}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">
                {supportLabels.actions.create.vi}
              </span>
              <span className="sm:hidden">+</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{supportLabels.form.title.vi}</DialogTitle>
            </DialogHeader>
            <TicketForm
              onSuccess={handleCreated}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Ticket list */}
      <TicketList
        tickets={tickets}
        isLoading={isLoading}
        onTicketClick={(id) => {
          window.location.href = `/hospital/support/${id}`;
        }}
      />
    </div>
  );
}
