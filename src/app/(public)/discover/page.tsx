"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { EventCard } from "@/components/public/event-card";

const eventTypes = [
  { value: undefined, label: "All" },
  { value: "concert" as const, label: "Concerts" },
  { value: "show" as const, label: "Shows" },
  { value: "dinner_theater" as const, label: "Dinner Theater" },
  { value: "comedy" as const, label: "Comedy" },
] as const;

type EventType = "concert" | "show" | "dinner_theater" | "comedy" | "private" | "other" | undefined;

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();
  const [selectedType, setSelectedType] = useState<EventType>(undefined);
  const [cursor, setCursor] = useState(0);

  const { data: venuesData } = trpc.discover.venues.useQuery();

  const { data: searchData } = trpc.discover.searchEvents.useQuery(
    { query: search },
    { enabled: search.length > 0 }
  );

  const { data: upcomingData, isLoading } = trpc.discover.upcomingEvents.useQuery(
    {
      venueId: selectedVenueId,
      eventType: selectedType,
      cursor,
      limit: 12,
    },
    { enabled: search.length === 0 }
  );

  const events = search.length > 0 ? searchData ?? [] : upcomingData?.items ?? [];
  const hasMore = search.length === 0 && (upcomingData?.hasMore ?? false);

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Events
          </h1>
          <p className="text-lg text-[#a1a1a1]">
            Discover upcoming shows, concerts, and experiences
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div
            className="flex items-center gap-3 rounded-xl px-4 h-12 border border-[rgba(255,255,255,0.08)]"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            <Search size={18} className="text-[#666] shrink-0" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCursor(0);
              }}
              className="flex-1 bg-transparent outline-none text-base text-white placeholder:text-[#666]"
            />
          </div>
        </div>

        {/* Filters */}
        {search.length === 0 && (
          <div className="mb-10 flex flex-wrap items-center gap-3">
            {/* Venue filter */}
            {venuesData && venuesData.length > 1 && (
              <select
                value={selectedVenueId ?? ""}
                onChange={(e) => {
                  setSelectedVenueId(e.target.value || undefined);
                  setCursor(0);
                }}
                className="rounded-xl px-4 py-2 text-sm outline-none cursor-pointer border border-[rgba(255,255,255,0.08)] text-white"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <option value="">All Venues</option>
                {venuesData.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}

            {/* Event type text buttons */}
            <div className="flex flex-wrap gap-1">
              {eventTypes.map((t) => {
                const isActive = selectedType === t.value;
                return (
                  <button
                    key={t.label}
                    onClick={() => {
                      setSelectedType(t.value as EventType);
                      setCursor(0);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? "text-white font-medium"
                        : "text-[#666] hover:text-[#a1a1a1]"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Results grid */}
        {isLoading && search.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{
                  aspectRatio: "3/4",
                  backgroundColor: "#1a1a1a",
                }}
              />
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
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

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() =>
                    setCursor((upcomingData?.nextCursor ?? 0))
                  }
                  className="text-sm text-[#a1a1a1] hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  Load more &rarr;
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#666]">
              No upcoming events
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
