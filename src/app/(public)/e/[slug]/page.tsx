import { notFound } from "next/navigation";
import { serverTRPC } from "@/lib/trpc/server";
import { TicketSelector } from "./ticket-selector";
import { ShareButton } from "./share-button";
import { MapPin } from "lucide-react";
import { HtmlContent } from "@/components/public/html-content";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trpc = await serverTRPC();

  let event;
  try {
    event = await trpc.checkout.getEventForCheckout({ slug });
  } catch {
    notFound();
  }

  const eventDate = new Date(event.startDate);
  const dateStr = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = eventDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const doorsStr = event.doorsOpen
    ? new Date(event.doorsOpen).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div>
      {/* Hero image — only if event has an image */}
      {event.imageUrl && (
        <div className="relative w-full" style={{ maxHeight: "50vh" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full object-cover"
            style={{ maxHeight: "50vh" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, #121110 0%, rgba(18,17,16,0.6) 40%, rgba(18,17,16,0.1) 100%)",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-20">
        {/* Date */}
        <p className="text-sm uppercase tracking-[0.15em] text-[#a1a1a1] mb-4">
          {dateStr} &middot; {timeStr}
        </p>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
          {event.title}
        </h1>

        {/* Venue */}
        <p className="mt-3 text-lg text-[#a1a1a1] font-light">
          {event.venue.name}
        </p>

        {/* Pills */}
        <div className="flex flex-wrap gap-2 mt-6">
          {event.eventType && (
            <span className="pill text-[11px]">
              {event.eventType.replace("_", " ")}
            </span>
          )}
          {doorsStr && (
            <span className="pill text-[11px]">Doors {doorsStr}</span>
          )}
          {event.settings?.ageRestriction && (
            <span className="pill text-[11px]">{event.settings.ageRestriction}</span>
          )}
        </div>

        {/* Divider */}
        <div className="mt-10 mb-10 h-px bg-[rgba(255,255,255,0.08)]" />

        {/* Two-column layout */}
        <div className="flex flex-col md:flex-row gap-16">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* About */}
            {event.description && (
              <section>
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: "var(--pub-text-muted)" }}>
                  About
                </h2>
                <HtmlContent
                  html={event.description}
                  className="prose-event text-base leading-relaxed"
                />
              </section>
            )}

            {/* Event details */}
            {(event.settings?.dresscode || event.settings?.dinnerIncluded) && (
              <section>
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: "var(--pub-text-muted)" }}>
                  Details
                </h2>
                <div className="space-y-3">
                  {event.settings?.dresscode && (
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-medium text-white">
                        Dress Code
                      </span>
                      <span className="text-sm text-[#a1a1a1]">
                        {event.settings.dresscode}
                      </span>
                    </div>
                  )}
                  {event.settings?.dinnerIncluded && (
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-medium text-white">
                        Dinner Included
                      </span>
                      <span className="text-sm text-[#a1a1a1]">
                        A meal is included with your ticket
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Venue card */}
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: "var(--pub-text-muted)" }}>
                Venue
              </h2>
              <div
                className="rounded-xl p-5 border border-[rgba(255,255,255,0.08)]"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 text-[#a1a1a1] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {event.venue.name}
                    </p>
                    {event.venue.address && (
                      <p className="text-sm text-[#a1a1a1] mt-1">
                        {event.venue.address}
                        {event.venue.city && `, ${event.venue.city}`}
                        {event.venue.state && `, ${event.venue.state}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Share */}
            <div>
              <ShareButton eventTitle={event.title} />
            </div>
          </div>

          {/* Right column — Ticket selector */}
          <div className="w-full md:w-[380px] shrink-0">
            <div className="md:sticky md:top-24">
              <TicketSelector
                eventId={event.id}
                eventSlug={event.slug}
                eventTitle={event.title}
                ticketTypes={event.ticketTypes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
