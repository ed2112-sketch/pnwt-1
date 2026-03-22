import Link from "next/link";

interface TicketType {
  price: number;
  quantity: number;
  quantitySold: number;
}

interface EventCardProps {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  startDate: Date;
  eventType: string;
  venue: { name: string };
  ticketTypes: TicketType[];
}

function formatDate(date: Date) {
  const d = new Date(date);
  const now = new Date();
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = d.getDate();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (d.getFullYear() !== now.getFullYear()) {
    return { top: `${month} ${day}, ${d.getFullYear()}`, bottom: time };
  }
  return { top: `${weekday}, ${month} ${day}`, bottom: time };
}

export function EventCard({
  slug,
  title,
  imageUrl,
  startDate,
  venue,
  ticketTypes,
}: EventCardProps) {
  const minPrice =
    ticketTypes.length > 0
      ? Math.min(...ticketTypes.map((t) => t.price))
      : null;

  const totalAvailable = ticketTypes.reduce(
    (sum, t) => sum + (t.quantity - t.quantitySold),
    0
  );
  const isSoldOut = ticketTypes.length > 0 && totalAvailable <= 0;
  const date = formatDate(startDate);

  return (
    <Link
      href={`/e/${slug}`}
      className="group relative block atmo-card overflow-hidden"
      style={{ aspectRatio: "4/5" }}
    >
      {/* Warm top accent line — barely visible until hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-20 transition-opacity duration-500 opacity-0 group-hover:opacity-100"
        style={{ background: "linear-gradient(to right, transparent 10%, var(--pub-warm) 50%, transparent 90%)" }}
      />

      {/* Background */}
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(18,17,16,0.95) 0%, rgba(18,17,16,0.5) 35%, rgba(18,17,16,0.1) 60%, transparent 100%)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: "var(--pub-bg-card)" }}>
          {/* Subtle texture for imageless cards */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at 30% 40%, rgba(196,168,130,0.8), transparent 50%)",
            }}
          />
        </div>
      )}

      {/* Content at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        {/* Date — the warm anchor */}
        <p
          className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-3"
          style={{ color: "var(--pub-warm)" }}
        >
          {date.top} &nbsp;&middot;&nbsp; {date.bottom}
        </p>

        {/* Title */}
        <h3
          className="text-xl font-semibold leading-[1.2] line-clamp-2 mb-1.5 tracking-[-0.01em]"
          style={{ color: "var(--pub-text)" }}
        >
          {title}
        </h3>

        {/* Venue */}
        <p className="text-[13px] mb-4" style={{ color: "var(--pub-text-muted)" }}>
          {venue.name}
        </p>

        {/* Price / Sold Out */}
        <div className="flex items-center justify-between">
          {isSoldOut ? (
            <span
              className="text-xs font-semibold tracking-[0.1em] uppercase px-3 py-1 rounded-full"
              style={{
                color: "#e5484d",
                background: "rgba(229,72,77,0.1)",
                border: "1px solid rgba(229,72,77,0.15)",
              }}
            >
              Sold Out
            </span>
          ) : minPrice !== null ? (
            <span className="text-sm font-medium" style={{ color: "var(--pub-text)" }}>
              From ${(minPrice / 100).toFixed(2)}
            </span>
          ) : null}

          {/* Arrow hint on hover */}
          <span
            className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-4px] group-hover:translate-x-0"
            style={{ color: "var(--pub-warm)" }}
          >
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
