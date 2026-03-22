import Link from "next/link";

interface VenueCardProps {
  name: string;
  slug: string;
  type: string;
  imageUrl: string | null;
  city: string | null;
  state: string | null;
  upcomingEventCount: number;
}

export function VenueCard({
  name,
  slug,
  imageUrl,
  city,
  state,
  upcomingEventCount,
}: VenueCardProps) {
  return (
    <Link
      href={`/v/${slug}`}
      className="group relative block atmo-card overflow-hidden"
      style={{ aspectRatio: "16/9" }}
    >
      {/* Background */}
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(18,17,16,0.85) 0%, rgba(18,17,16,0.3) 50%, transparent 100%)",
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "var(--pub-bg-card)" }}
        />
      )}

      {/* Content at bottom-left */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        <h3 className="text-xl font-semibold text-white mb-1">{name}</h3>
        {(city || state) && (
          <p className="text-sm text-[#a1a1a1] mb-2">
            {[city, state].filter(Boolean).join(", ")}
          </p>
        )}
        {upcomingEventCount > 0 && (
          <span className="pill text-[11px]">
            {upcomingEventCount} upcoming
          </span>
        )}
      </div>
    </Link>
  );
}
