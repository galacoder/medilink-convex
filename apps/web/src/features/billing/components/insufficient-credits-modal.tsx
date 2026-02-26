/**
 * Insufficient AI credits modal.
 *
 * WHY: Shown when a user tries to use an AI feature without enough credits.
 * Displays current balance, required amount, deficit, and contact CTA.
 *
 * vi: "Modal khong du credit AI"
 * en: "Insufficient AI credits modal"
 *
 * @see Issue #177 -- M1-8: AI Credit Balance UI
 */
"use client";

import { AlertCircle, MessageCircle } from "lucide-react";

import { Button } from "@medilink/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@medilink/ui/dialog";

interface InsufficientCreditsModalProps {
  open: boolean;
  onClose: () => void;
  required: number;
  available: number;
  featureLabel: string;
  featureLabelVi: string;
}

export function InsufficientCreditsModal({
  open,
  onClose,
  required,
  available,
  featureLabel,
  featureLabelVi,
}: InsufficientCreditsModalProps) {
  const deficit = required - available;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 rounded-full bg-red-100 p-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-center">
            Khong du credit AI / Insufficient AI Credits
          </DialogTitle>
          <DialogDescription className="text-center">
            Ban can {required} credits de su dung &quot;{featureLabelVi}&quot;.
            Hien tai ban co {available} credits.
            <br />
            You need {required} credits for &quot;{featureLabel}&quot;. You
            currently have {available} credits.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{available}</div>
          <div className="text-muted-foreground text-sm">
            credits hien co / credits available
          </div>
          <div className="mt-1 text-sm">
            Can them / Need: <span className="font-medium">{deficit}</span>{" "}
            credits
          </div>
        </div>

        <div className="space-y-2">
          <Button className="w-full" variant="default">
            <MessageCircle className="mr-2 h-4 w-4" />
            Lien he quan tri vien / Contact Administrator
          </Button>
          <Button className="w-full" variant="outline" onClick={onClose}>
            Dong / Close
          </Button>
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Credit duoc cap phat vao ngay 1 moi thang. / Credits are allocated on
          the 1st of each month.
        </p>
      </DialogContent>
    </Dialog>
  );
}
