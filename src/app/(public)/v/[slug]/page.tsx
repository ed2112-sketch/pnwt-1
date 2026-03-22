import { notFound } from "next/navigation";
import { serverTRPC } from "@/lib/trpc/server";
import { EventCard } from "@/components/public/event-card";
import { VenueCard } from "@/components/public/venue-card";

const typeLabels: Record<string, string> = {
  theater: "Theater",
  restaurant: "Restaurant",
  bar: "Bar",
  club: "Club",
  outdoor: "Outdoor Venue",
  other: "Venue",
};

const typeGradients: Record<string, string> = {
  theater: "radial-gradient(ellipse 80% 50% at 50% 30%, oklch(0.3 0.18 270), oklch(0.09 0.01 270))",
  restaurant: "radial-gradient(ellipse 80% 50% at 50% 30%, oklch(0.3 0.16 50), oklch(0.09 0.01 270))",
  bar: "radial-gradient(ellipse 80% 50% at 50% 30%, oklch(0.3 0.15 330), oklch(0.09 0.01 270))",
  club: "radial-gradient(ellipse 80% 50% at 50% 30%, oklch(0.3 0.2 300), oklch(0.09 0.01 270))",
  outdoor: "radial-gradient(ellipse 80% 50% at 50% 30%, oklch(0.3 0.15 150), oklch(0.09 0.01 270))",
  other: "radial-gradient(ellipse 80% 50% at 50% 30%, oklch(0.3 0.1 220), oklch(0.09 0.01 270))",
};

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trpc = await serverTRPC();

  const [venue, allVenues] = await Promise.all([
    trpc.discover.venueBySlug({ slug }),
    trpc.discover.venues(),
  ]);

  if (!venue) {
    notFound();
  }

  const otherVenues = allVenues.filter((v) => v.slug !== slug);

  return (
    <div>
      {/* Hero */}
      <section
        className="relative pt-20 pb-16 md:pt-28 md:pb-24"
        style={{
          minHeight: "50vh",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {/* Background */}
        {venue.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={venue.imageUrl}
              alt={venue.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 img-gradient-overlay" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, oklch(0.09 0.01 270 / 40%) 0%, oklch(0.09 0.01 270 / 80%) 60%, oklch(0.09 0.01 270) 100%)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: typeGradients[venue.type] ?? typeGradients.other,
            }}
          />
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="animate-fade-in-up">
            <span
              className="glass-card inline-block px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ color: "var(--pub-accent)" }}
            >
              {typeLabels[venue.type] ?? "Venue"}
            </span>
            <h1
              className="text-4xl md:text-6xl font-bold mb-4"
              style={{ color: "var(--pub-text)" }}
            >
              {venue.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              {venue.address && (
                <p
                  className="text-sm"
                  style={{ color: "var(--pub-text-muted)" }}
                >
                  {venue.address}
                  {venue.city && `, ${venue.city}`}
                  {venue.state && `, ${venue.state}`}
                </p>
              )}
              {venue.capacity && (
                <span
                  className="glass-card px-3 py-1 rounded-full text-xs font-medium"
                  style={{ color: "var(--pub-text-muted)" }}
                >
                  Capacity: {venue.capacity}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      {venue.description && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p
              className="text-lg leading-relaxed max-w-3xl"
              style={{ color: "var(--pub-text-muted)" }}
            >
              {venue.description}
            </p>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {venue.events && venue.events.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold whitespace-nowrap">
                Upcoming at <span className="gradient-text">{venue.name}</span>
              </h2>
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    "linear-gradient(to right, var(--pub-primary), transparent)",
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {venue.events.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  slug={event.slug}
                  title={event.title}
                  imageUrl={event.imageUrl}
                  startDate={event.startDate}
                  eventType={event.eventType}
                  venue={{ name: venue.name }}
                  ticketTypes={event.ticketTypes}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other Venues */}
      {otherVenues.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold whitespace-nowrap">
                More <span className="gradient-text">Venues</span>
              </h2>
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    "linear-gradient(to right, var(--pub-primary), transparent)",
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherVenues.map((v) => (
                <VenueCard
                  key={v.id}
                  name={v.name}
                  slug={v.slug}
                  type={v.type}
                  imageUrl={v.imageUrl}
                  city={v.city}
                  state={v.state}
                  upcomingEventCount={v.upcomingEventCount}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!venue.events || venue.events.length === 0) && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p
              className="text-lg"
              style={{ color: "var(--pub-text-muted)" }}
            >
              No upcoming events at this venue. Check back soon!
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
