"use client";

import { useRef } from "react";

import QRCode from "react-qr-code";
import { PrinterIcon } from "lucide-react";

import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import { equipmentLabels } from "../labels";

interface EquipmentQRProps {
  equipmentId: string;
  equipmentName: string;
  /** Base URL for the QR code link (e.g. https://medilink.example.com) */
  baseUrl?: string;
}

/**
 * QR code display component for equipment identification.
 *
 * WHY: Hospital staff on the floor scan QR codes on physical equipment to
 * quickly navigate to the equipment detail page on tablets or phones,
 * without typing long IDs or searching through the list.
 */
export function EquipmentQR({
  equipmentId,
  equipmentName,
  baseUrl,
}: EquipmentQRProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const qrValue = baseUrl
    ? `${baseUrl}/hospital/equipment/${equipmentId}`
    : `/hospital/equipment/${equipmentId}`;

  function handlePrint() {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${equipmentLabels.equipmentQR.vi} - ${equipmentName}</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .print-content { text-align: center; padding: 24px; }
            .print-content p { margin-top: 12px; font-family: sans-serif; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${printContent}
            <p>${equipmentName}</p>
            <p style="color: #666; font-size: 12px;">${equipmentId}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {equipmentLabels.equipmentQR.vi}{" "}
          <span className="text-muted-foreground font-normal">
            ({equipmentLabels.equipmentQR.en})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div ref={printRef} className="rounded-lg bg-white p-4">
          <QRCode
            value={qrValue}
            size={180}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox="0 0 180 180"
          />
        </div>

        <p className="text-muted-foreground max-w-[180px] break-all text-center text-xs">
          {qrValue}
        </p>

        <Button variant="outline" size="sm" onClick={handlePrint}>
          <PrinterIcon className="mr-2 h-4 w-4" />
          {equipmentLabels.printQR.vi}
        </Button>
      </CardContent>
    </Card>
  );
}
