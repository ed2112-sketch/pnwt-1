import { notFound } from "next/navigation";
import { serverTRPC } from "@/lib/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PrintButton } from "./print-button";

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function RunsheetPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const trpc = await serverTRPC();

  let event;
  try {
    event = await trpc.event.getById({ id: eventId });
  } catch {
    notFound();
  }

  const stats = await trpc.ticket.getCheckInStats({ eventId });

  // Get ticket type breakdown
  const ticketTypes = event.ticketTypes ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl mx-auto print:max-w-none print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Day-of-Show Runsheet</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
        <PrintButton />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-lg">{event.venue.name}</p>
        <p>{formatDate(event.startDate)}</p>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {event.doorsOpen && (
              <div className="flex items-center gap-4">
                <span className="text-2xl">🚪</span>
                <div>
                  <p className="font-medium">Doors Open</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(event.doorsOpen)}
                  </p>
                </div>
              </div>
            )}
            {event.settings?.dinnerIncluded && (
              <div className="flex items-center gap-4">
                <span className="text-2xl">🍽️</span>
                <div>
                  <p className="font-medium">Dinner Service</p>
                  <p className="text-sm text-muted-foreground">
                    Before show
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <span className="text-2xl">🎤</span>
              <div>
                <p className="font-medium">Show Begins</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(event.startDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl">🎪</span>
              <div>
                <p className="font-medium">Show Ends</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(event.endDate)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity & Occupancy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capacity & Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.total - stats.cancelled}</p>
              <p className="text-xs text-muted-foreground">Tickets Sold</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.event.venueCapacity ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Venue Capacity</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.event.venueCapacity
                  ? `${Math.round(((stats.total - stats.cancelled) / stats.event.venueCapacity) * 100)}%`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Occupancy</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stats.checkedIn}
              </p>
              <p className="text-xs text-muted-foreground">Checked In</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.remaining}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.rate}%</p>
              <p className="text-xs text-muted-foreground">Check-in Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticketTypes.map((tt) => {
            const sold = tt.quantitySold;
            const total = tt.quantity;
            const pct = total > 0 ? Math.round((sold / total) * 100) : 0;

            return (
              <div key={tt.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{tt.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {sold} / {total} sold ({pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Event Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Venue</span>
            <span>{event.venue.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="capitalize">
              {event.eventType.replace("_", " ")}
            </span>
          </div>
          {event.settings?.ageRestriction && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age Restriction</span>
              <span>{event.settings.ageRestriction}</span>
            </div>
          )}
          {event.settings?.dresscode && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dress Code</span>
              <span>{event.settings.dresscode}</span>
            </div>
          )}
          {event.settings?.dinnerIncluded && (
            <Badge variant="secondary">Dinner Included</Badge>
          )}
          {event.isFeatured && <Badge>Featured Event</Badge>}
        </CardContent>
      </Card>
    </div>
  );
}
