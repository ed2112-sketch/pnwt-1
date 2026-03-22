import Link from "next/link";
import { Plus } from "lucide-react";
import { serverTRPC } from "@/lib/trpc/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function VenuesPage() {
  const trpc = await serverTRPC();
  const venues = await trpc.venue.list();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Venues</h1>
        <Button render={<Link href="/venues/new" />}>
            <Plus className="mr-2 size-4" />
            Add Venue
        </Button>
      </div>

      {venues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No venues yet.</p>
            <Button className="mt-4" render={<Link href="/venues/new" />}>Add your first venue</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{venue.name}</CardTitle>
                    <Badge variant={venue.isActive ? "default" : "secondary"}>
                      {venue.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="capitalize">{venue.type.replace("_", " ")}</p>
                    {venue.address && <p>{venue.address}</p>}
                    {venue.city && (
                      <p>
                        {venue.city}
                        {venue.state ? `, ${venue.state}` : ""}{" "}
                        {venue.zip}
                      </p>
                    )}
                    {venue.capacity && <p>Capacity: {venue.capacity}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
