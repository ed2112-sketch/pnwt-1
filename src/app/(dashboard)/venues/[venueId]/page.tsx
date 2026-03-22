import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { serverTRPC } from "@/lib/trpc/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const trpc = await serverTRPC();

  let venue;
  try {
    venue = await trpc.venue.getById({ id: venueId });
  } catch {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{venue.name}</h1>
          <p className="text-muted-foreground capitalize">
            {venue.type.replace("_", " ")}
            {venue.capacity ? ` · Capacity: ${venue.capacity}` : ""}
          </p>
        </div>
        <Button variant="outline" render={<Link href={`/venues/${venue.id}/edit`} />}>
            <Pencil className="mr-2 size-4" />
            Edit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {venue.description && <p>{venue.description}</p>}
            {venue.address && (
              <p className="text-muted-foreground">
                {venue.address}
                <br />
                {venue.city}
                {venue.state ? `, ${venue.state}` : ""} {venue.zip}
              </p>
            )}
            {venue.phone && (
              <p className="text-muted-foreground">Phone: {venue.phone}</p>
            )}
            {venue.email && (
              <p className="text-muted-foreground">Email: {venue.email}</p>
            )}
            <div className="pt-2">
              <Badge variant={venue.isActive ? "default" : "secondary"}>
                {venue.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Dinner service:{" "}
              {venue.settings?.hasDinnerService ? "Yes" : "No"}
            </p>
            {venue.settings?.autoGratuityPercent != null && (
              <p>Auto-gratuity: {venue.settings.autoGratuityPercent}%</p>
            )}
            {venue.settings?.taxRate != null && (
              <p>Tax rate: {venue.settings.taxRate}%</p>
            )}
            {venue.settings?.serviceChargePercent != null && (
              <p>Service charge: {venue.settings.serviceChargePercent}%</p>
            )}
            <p>
              Cross-promo:{" "}
              {venue.settings?.crossPromoEnabled ? "Enabled" : "Disabled"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events at this venue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Events</CardTitle>
          <Button variant="ghost" size="sm" render={<Link href={`/events/new?venueId=${venue.id}`} />}>Add Event</Button>
        </CardHeader>
        <CardContent>
          {venue.events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No events at this venue yet.
            </p>
          ) : (
            <div className="space-y-2">
              {venue.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.startDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary">{event.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
