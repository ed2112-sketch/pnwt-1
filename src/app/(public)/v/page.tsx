import { serverTRPC } from "@/lib/trpc/server";
import { VenueCard } from "@/components/public/venue-card";

export default async function VenuesPage() {
  const trpc = await serverTRPC();
  const venues = await trpc.discover.venues();

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our <span className="gradient-text">Venues</span>
          </h1>
          <p style={{ color: "var(--pub-text-muted)" }} className="text-lg">
            Pacific Northwest&apos;s finest stages and gathering places.
          </p>
        </div>

        {/* Venues grid */}
        {venues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueCard
                key={venue.id}
                name={venue.name}
                slug={venue.slug}
                type={venue.type}
                imageUrl={venue.imageUrl}
                city={venue.city}
                state={venue.state}
                upcomingEventCount={venue.upcomingEventCount}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p
              className="text-lg"
              style={{ color: "var(--pub-text-muted)" }}
            >
              No venues available yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
