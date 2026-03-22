import { serverTRPC } from "@/lib/trpc/server";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export default async function VerifyTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const trpc = await serverTRPC();

  const result = await trpc.ticket.verify({ qrCodeData: "PNWT:" + ticketId });

  if (result.valid && result.ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="mx-auto size-16 text-green-500" />
            <h1 className="text-2xl font-bold text-green-700">Valid Ticket</h1>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-base">{result.ticket.event.title}</p>
              <p className="text-muted-foreground">{result.ticket.ticketType.name}</p>
              <p className="text-muted-foreground">{result.ticket.attendeeName}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {result.ticket.ticketNumber}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result.valid && result.ticket) {
    // Already checked in
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="mx-auto size-16 text-yellow-500" />
            <h1 className="text-2xl font-bold text-yellow-700">Already Checked In</h1>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-base">{result.ticket.event.title}</p>
              <p className="text-muted-foreground">{result.ticket.ticketType.name}</p>
              <p className="text-muted-foreground">{result.ticket.attendeeName}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {result.ticket.ticketNumber}
              </p>
              {"checkedInAt" in result.ticket && result.ticket.checkedInAt && (
                <p className="text-xs text-muted-foreground">
                  Checked in at{" "}
                  {new Date(result.ticket.checkedInAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found or cancelled
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <XCircle className="mx-auto size-16 text-red-500" />
          <h1 className="text-2xl font-bold text-red-700">Invalid Ticket</h1>
          <p className="text-sm text-muted-foreground">
            {result.message ?? "This ticket could not be verified."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
