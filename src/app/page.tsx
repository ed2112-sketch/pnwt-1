import Link from "next/link";
import { serverTRPC } from "@/lib/trpc/server";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { Hero } from "@/components/public/hero";
import { EventCard } from "@/components/public/event-card";
import { VenueCard } from "@/components/public/venue-card";

export default async function HomePage() {
  const trpc = await serverTRPC();

  const [featuredEvents, upcomingData, venues] = await Promise.all([
    trpc.discover.featuredEvents(),
    trpc.discover.upcomingEvents({ limit: 8 }),
    trpc.discover.venues(),
  ]);

  return (
    <div
      className="public-site min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--pub-bg)", color: "var(--pub-text)" }}
    >
      <Navbar />

      {/* Hero */}
      <Hero />

      {/* Warm divider after hero */}
      <div className="warm-line" />

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-24 md:py-32 section-glow">
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-4" style={{ color: "var(--pub-warm)" }}>
              Featured
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold mb-4 tracking-tight" style={{ color: "var(--pub-text)" }}>
              Don&apos;t miss these
            </h2>
            <p className="text-base mb-14" style={{ color: "var(--pub-text-muted)" }}>
              Hand-picked events happening soon at our venues.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.slice(0, 6).map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  slug={event.slug}
                  title={event.title}
                  imageUrl={event.imageUrl}
                  startDate={event.startDate}
                  eventType={event.eventType}
                  venue={event.venue}
                  ticketTypes={event.ticketTypes}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {upcomingData.items.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-4" style={{ color: "var(--pub-text-muted)" }}>
              Coming Up
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold mb-4 tracking-tight" style={{ color: "var(--pub-text)" }}>
              Upcoming events
            </h2>
            <p className="text-base mb-14" style={{ color: "var(--pub-text-muted)" }}>
              See what&apos;s next on the calendar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingData.items.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  slug={event.slug}
                  title={event.title}
                  imageUrl={event.imageUrl}
                  startDate={event.startDate}
                  eventType={event.eventType}
                  venue={event.venue}
                  ticketTypes={event.ticketTypes}
                />
              ))}
            </div>
            {upcomingData.hasMore && (
              <div className="mt-12">
                <Link
                  href="/discover"
                  className="text-sm transition-colors duration-300 hover:text-[#c4a882]"
                  style={{ color: "var(--pub-text-secondary)" }}
                >
                  See all events &rarr;
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Warm divider */}
      <div className="warm-line max-w-6xl mx-auto" />

      {/* Venues */}
      {venues.length > 0 && (
        <section className="py-24 md:py-32 section-glow">
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-4" style={{ color: "var(--pub-warm)" }}>
              Our Venues
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold mb-4 tracking-tight" style={{ color: "var(--pub-text)" }}>
              Three stages, one experience
            </h2>
            <p className="text-base mb-14" style={{ color: "var(--pub-text-muted)" }}>
              Each with its own character. All under one roof.
            </p>
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
          </div>
        </section>
      )}

      {/* Empty state */}
      {featuredEvents.length === 0 &&
        upcomingData.items.length === 0 &&
        venues.length === 0 && (
          <section className="py-24 md:py-32">
            <div className="max-w-6xl mx-auto px-6 text-center">
              <p className="text-lg text-[#a1a1a1]">
                Events coming soon. Stay tuned.
              </p>
            </div>
          </section>
        )}

      {/* Final CTA — the emotional closer */}
      <section className="py-32 md:py-44 section-glow relative overflow-hidden">
        {/* Extra warm glow for this section */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(196,168,130,0.05) 0%, transparent 60%)" }}
        />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="warm-line w-12 mx-auto mb-12" />
          <h2
            className="text-3xl md:text-5xl lg:text-6xl font-semibold mb-6 tracking-[-0.03em] leading-[1.1]"
            style={{ color: "var(--pub-text)" }}
          >
            Something extraordinary
            <br />
            <span style={{ color: "var(--pub-warm)" }}>is always happening here.</span>
          </h2>
          <p className="text-lg mb-12" style={{ color: "var(--pub-text-muted)" }}>
            Find your next unforgettable night.
          </p>
          <Link
            href="/discover"
            className="btn-primary inline-flex items-center gap-2 px-10 py-[18px] rounded-full text-[15px] font-medium"
          >
            <span>Explore all events</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-[1px]">
              <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
