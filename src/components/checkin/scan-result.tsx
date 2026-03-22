"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScanStatus = "valid" | "already_used" | "invalid" | null;

interface ScanResultProps {
  status: ScanStatus;
  attendeeName?: string;
  ticketType?: string;
  ticketNumber?: string;
  message?: string;
  onCheckIn?: () => void;
  checkInPending?: boolean;
}

export function ScanResult({
  status,
  attendeeName,
  ticketType,
  ticketNumber,
  message,
  onCheckIn,
  checkInPending,
}: ScanResultProps) {
  if (!status) return null;

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-6 text-center transition-all",
        status === "valid" && "border-green-500 bg-green-50 dark:bg-green-950/20",
        status === "already_used" && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
        status === "invalid" && "border-red-500 bg-red-50 dark:bg-red-950/20"
      )}
    >
      <div className="flex flex-col items-center gap-3">
        {status === "valid" && (
          <CheckCircle2 className="size-16 text-green-600" />
        )}
        {status === "already_used" && (
          <AlertTriangle className="size-16 text-yellow-600" />
        )}
        {status === "invalid" && (
          <XCircle className="size-16 text-red-600" />
        )}

        {attendeeName && (
          <p className="text-2xl font-bold">{attendeeName}</p>
        )}
        {ticketType && (
          <p className="text-lg text-muted-foreground">{ticketType}</p>
        )}
        {ticketNumber && (
          <p className="text-sm font-mono text-muted-foreground">
            {ticketNumber}
          </p>
        )}
        {message && <p className="text-sm">{message}</p>}

        {status === "valid" && onCheckIn && (
          <Button
            size="lg"
            className="mt-2 h-14 px-8 text-lg"
            onClick={onCheckIn}
            disabled={checkInPending}
          >
            {checkInPending ? "Checking in..." : "Check In"}
          </Button>
        )}
      </div>
    </div>
  );
}
