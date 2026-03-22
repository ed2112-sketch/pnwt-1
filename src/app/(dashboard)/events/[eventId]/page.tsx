import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Gift, FileText } from "lucide-react";
import { serverTRPC } from "@/lib/trpc/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const tabs = [
  { label: "Overview", segment: null },
  { label: "Tickets", segment: "tickets" },
  { label: "Pricing", segment: "pricing" },
  { label: "Attendees", segment: "attendees" },
  { label: "Waitlist", segment: "waitlist" },
  { label: "Check-in", segment: "checkin" },
  { label: "Analytics", segment: "analytics" },
] as const;

export default async function EventDetailPage({
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <Badge
              variant={
                event.status === "published"
                  ? "default"
                  : event.status === "cancelled"
                    ? "destructive"
                    : "secondary"
              }
            >
              {event.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {event.venue.name} &middot;{" "}
            <span className="capitalize">{event.eventType.replace("_", " ")}</span>
          </p>
          {event.status === "published" && (
            <p className="text-sm">
              <Link href={`/e/${event.slug}`} className="text-primary underline" target="_blank">
                /e/{event.slug}
              </Link>
              {" "}<span className="text-muted-foreground">— public link</span>
            </p>
          )}
        </div>
        <Button variant="outline" render={<Link href={`/events/${event.id}/edit`} />}>
          <Pencil className="mr-2 size-4" />
          Edit
        </Button>
      </div>

      {/* Tab bar */}
      <div className="border-b">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const href = tab.segment
              ? `/events/${event.id}/${tab.segment}`
              : `/events/${event.id}`;
            const isActive = tab.segment === null;
            return (
              <Link
                key={tab.label}
                href={href}
                className={
                  isActive
                    ? "border-b-2 border-primary text-foreground font-medium pb-2.5 text-sm"
                    : "text-muted-foreground hover:text-foreground pb-2.5 text-sm transition-colors"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Secondary actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" render={<Link href={`/events/${event.id}/comp`} />}>
          <Gift className="mr-2 size-4" />
          Comp
        </Button>
        <Button variant="outline" size="sm" render={<Link href={`/events/${event.id}/runsheet`} />}>
          <FileText className="mr-2 size-4" />
          Runsheet
        </Button>
      </div>

      {/* Overview content */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start</span>
              <span>
                {event.startDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End</span>
              <span>
                {event.endDate.toLocaleDateString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {event.doorsOpen && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doors Open</span>
                <span>
                  {event.doorsOpen.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {event.shortDescription && <p>{event.shortDescription}</p>}
            {event.description && (
              <div
                className="text-muted-foreground prose prose-sm max-w-none [&_p]:mb-2 [&_a]:text-primary [&_a]:underline [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            )}
            {event.isFeatured && (
              <Badge variant="secondary">Featured</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Types */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Ticket Types</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href={`/events/${event.id}/tickets`} />}>Manage</Button>
        </CardHeader>
        <CardContent>
          {event.ticketTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No ticket types yet.{" "}
              <Link
                href={`/events/${event.id}/tickets`}
                className="text-primary underline"
              >
                Add some
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {event.ticketTypes.map((tt) => (
                <div
                  key={tt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{tt.name}</p>
                    {tt.description && (
                      <p className="text-xs text-muted-foreground">
                        {tt.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{formatPrice(tt.price)}</p>
                    <p className="text-xs text-muted-foreground">
                      {tt.quantitySold} / {tt.quantity} sold
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
