"use client";

import { use, useState, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsBar } from "@/components/checkin/stats-bar";
import { ScanResult } from "@/components/checkin/scan-result";
import { ScannerInput } from "@/components/checkin/scanner-input";
import { RecentLog } from "@/components/checkin/recent-log";
import { ScanLine, Search } from "lucide-react";

type ScanStatus = "valid" | "already_used" | "invalid" | null;

export default function CheckInPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [scanStatus, setScanStatus] = useState<ScanStatus>(null);
  const [scanData, setScanData] = useState<{
    ticketId?: string;
    attendeeName?: string;
    ticketType?: string;
    ticketNumber?: string;
    message?: string;
  }>({});
  const [manualSearch, setManualSearch] = useState("");

  const utils = trpc.useUtils();

  const { data: stats } = trpc.ticket.getCheckInStats.useQuery(
    { eventId },
    { refetchInterval: 5000 }
  );

  const { data: recentCheckIns } = trpc.ticket.getRecentCheckIns.useQuery(
    { eventId, limit: 10 },
    { refetchInterval: 5000 }
  );

  const { data: searchResults } = trpc.ticket.listByEvent.useQuery(
    { eventId, search: manualSearch, status: "valid" },
    { enabled: mode === "manual" && manualSearch.length >= 2 }
  );

  const checkIn = trpc.ticket.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Checked in!");
      setScanStatus(null);
      setScanData({});
      utils.ticket.getCheckInStats.invalidate({ eventId });
      utils.ticket.getRecentCheckIns.invalidate({ eventId });
      utils.ticket.listByEvent.invalidate({ eventId });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleScan = useCallback(
    async (data: string) => {
      setScanStatus(null);
      setScanData({});

      // Normalize: if someone types just the UUID, wrap it
      const qrData = data.startsWith("PNWT:") ? data : `PNWT:${data}`;

      try {
        const result = await utils.client.ticket.verify.query({
          qrCodeData: qrData,
        });

        if (result.valid && result.ticket) {
          setScanStatus("valid");
          setScanData({
            ticketId: result.ticket.id,
            attendeeName: result.ticket.attendeeName,
            ticketType: result.ticket.ticketType.name,
            ticketNumber: result.ticket.ticketNumber,
          });
          // Vibrate on success
          if (navigator.vibrate) navigator.vibrate(200);
        } else if (
          !result.valid &&
          result.message?.includes("already been checked in")
        ) {
          setScanStatus("already_used");
          const ticket = "ticket" in result ? result.ticket : undefined;
          setScanData({
            attendeeName: ticket?.attendeeName,
            ticketType: ticket?.ticketType?.name,
            ticketNumber: ticket?.ticketNumber,
            message: result.message,
          });
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        } else {
          setScanStatus("invalid");
          setScanData({ message: result.message ?? "Invalid ticket" });
          if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
        }
      } catch {
        setScanStatus("invalid");
        setScanData({ message: "Failed to verify ticket" });
      }

      // Auto-clear after 5 seconds
      setTimeout(() => {
        setScanStatus(null);
        setScanData({});
      }, 5000);
    },
    [utils.client.ticket.verify]
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold">
          {stats?.event.title ?? "Check-in"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {stats?.event.venueName}
          {stats?.event.doorsOpen &&
            ` · Doors ${new Date(stats.event.doorsOpen).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <StatsBar
          checkedIn={stats.checkedIn}
          remaining={stats.remaining}
          total={stats.total}
          rate={stats.rate}
        />
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "scan" ? "default" : "outline"}
          onClick={() => setMode("scan")}
          className="flex-1"
        >
          <ScanLine className="mr-2 size-4" />
          Scanner
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
          className="flex-1"
        >
          <Search className="mr-2 size-4" />
          Manual
        </Button>
      </div>

      {/* Scanner Mode */}
      {mode === "scan" && (
        <>
          <ScannerInput
            onScan={handleScan}
            disabled={checkIn.isPending}
          />
          <ScanResult
            status={scanStatus}
            attendeeName={scanData.attendeeName}
            ticketType={scanData.ticketType}
            ticketNumber={scanData.ticketNumber}
            message={scanData.message}
            onCheckIn={() => {
              if (scanData.ticketId) {
                checkIn.mutate({ ticketId: scanData.ticketId });
              }
            }}
            checkInPending={checkIn.isPending}
          />
        </>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <div className="space-y-3">
          <Input
            placeholder="Search by name, email, or ticket #..."
            value={manualSearch}
            onChange={(e) => setManualSearch(e.target.value)}
            className="h-12 text-base"
            autoFocus
          />
          {searchResults?.tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{ticket.attendeeName}</p>
                <p className="text-xs text-muted-foreground">
                  {ticket.ticketType.name} · {ticket.ticketNumber}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => checkIn.mutate({ ticketId: ticket.id })}
                disabled={checkIn.isPending}
              >
                Check In
              </Button>
            </div>
          ))}
          {manualSearch.length >= 2 &&
            searchResults?.tickets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No matching tickets found.
              </p>
            )}
        </div>
      )}

      {/* Recent Check-ins */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentLog entries={recentCheckIns ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
