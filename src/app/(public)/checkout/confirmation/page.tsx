"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  Ticket,
  Smartphone,
  CalendarPlus,
  Share2,
  Check,
  Copy,
  ArrowRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { QrCode } from "@/components/qr-code";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/* ---- Confetti pieces (CSS-only) ---- */
const CONFETTI_COLORS = [
  "var(--pub-primary)",
  "var(--pub-accent)",
  "var(--pub-gradient-start)",
  "var(--pub-gradient-mid)",
  "var(--pub-gradient-end)",
  "oklch(0.7 0.2 150)",
  "oklch(0.75 0.15 25)",
  "oklch(0.7 0.25 330)",
];

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${5 + (i * 4.7) % 90}%`,
            top: "-20px",
            width: `${8 + (i % 4) * 3}px`,
            height: `${8 + (i % 3) * 4}px`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            borderRadius: i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0",
            animationDelay: `${(i * 0.15) % 2}s`,
            animationDuration: `${2.5 + (i % 5) * 0.3}s`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [linkCopied, setLinkCopied] = useState(false);

  const orderQuery = trpc.checkout.getOrder.useQuery(
    { orderId: orderId ?? "" },
    { enabled: !!orderId }
  );

  const ticketsQuery = trpc.ticket.getByOrderId.useQuery(
    { orderId: orderId ?? "" },
    { enabled: !!orderId }
  );

  if (!orderId) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-20 text-center"
        style={{ backgroundColor: "var(--pub-bg)", color: "var(--pub-text)" }}
      >
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--pub-text)" }}>
          No order found
        </h1>
        <p className="mb-8" style={{ color: "var(--pub-text-muted)" }}>
          We couldn&apos;t find an order to display.
        </p>
        <Link
          href="/"
          className="btn-gradient inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300"
        >
          Browse Events
        </Link>
      </div>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-20 text-center"
        style={{ backgroundColor: "var(--pub-bg)" }}
      >
        <div className="shimmer h-20 w-20 mx-auto rounded-full mb-6" />
        <div className="shimmer h-8 w-48 mx-auto rounded-lg mb-4" />
        <div className="shimmer h-4 w-64 mx-auto rounded-lg" />
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-20 text-center"
        style={{ backgroundColor: "var(--pub-bg)", color: "var(--pub-text)" }}
      >
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--pub-text)" }}>
          Order not found
        </h1>
        <p className="mb-8" style={{ color: "var(--pub-text-muted)" }}>
          We couldn&apos;t find this order. Please check your email for confirmation details.
        </p>
        <Link
          href="/"
          className="btn-gradient inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300"
        >
          Browse Events
        </Link>
      </div>
    );
  }

  const order = orderQuery.data;
  const ticketsList = ticketsQuery.data ?? [];

  const eventDate = new Date(order.event.startDate);
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

  // Generate ICS calendar data URI
  function getCalendarUrl() {
    const start = eventDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endDate = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000); // +3h default
    const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PNWTickets//EN",
      "BEGIN:VEVENT",
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${order.event.title}`,
      `LOCATION:${order.event.venue.name}`,
      `DESCRIPTION:Your tickets for ${order.event.title} at ${order.event.venue.name}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/e/${order.event.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // silent
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--pub-bg)", color: "var(--pub-text)" }}
    >
      <Confetti />

      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* Success header */}
        <div className="text-center mb-12">
          <CheckCircle2
            className="mx-auto size-20 mb-5 animate-bounce-in"
            style={{ color: "var(--pub-primary)" }}
          />
          <h1 className="text-3xl md:text-4xl font-bold gradient-text animate-fade-in-up mb-3">
            Order Confirmed!
          </h1>
          <p
            className="animate-fade-in-up-delay-1"
            style={{ color: "var(--pub-text-muted)" }}
          >
            Order #{order.id.slice(0, 8)}
          </p>
          <p
            className="text-sm mt-2 animate-fade-in-up-delay-1"
            style={{ color: "var(--pub-text-muted)" }}
          >
            Confirmation sent to{" "}
            <span style={{ color: "var(--pub-text)" }}>{order.email}</span>
          </p>
        </div>

        {/* Event details card */}
        <div className="glass-card rounded-xl p-6 mb-6 animate-fade-in-up-delay-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2
                className="text-xl font-bold mb-1"
                style={{ color: "var(--pub-text)" }}
              >
                {order.event.title}
              </h2>
              <p className="text-sm" style={{ color: "var(--pub-text-muted)" }}>
                {order.event.venue.name}
              </p>
              <p className="text-sm" style={{ color: "var(--pub-text-muted)" }}>
                {dateStr} at {timeStr}
              </p>
            </div>
            <a
              href={getCalendarUrl()}
              download={`${order.event.title}.ics`}
              className="glass-card inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shrink-0"
              style={{ color: "var(--pub-primary)" }}
            >
              <CalendarPlus className="size-4" />
              Add to Calendar
            </a>
          </div>
        </div>

        {/* Order items + pricing */}
        <div className="glass-card rounded-xl p-6 mb-6 animate-fade-in-up-delay-2">
          <div className="space-y-2.5 text-sm mb-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between"
              >
                <span style={{ color: "var(--pub-text-muted)" }}>
                  {item.ticketType.name} &times; {item.quantity}
                </span>
                <span className="font-medium" style={{ color: "var(--pub-text)" }}>
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px my-4" style={{ background: "var(--pub-border)" }} />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--pub-text-muted)" }}>Subtotal</span>
              <span style={{ color: "var(--pub-text)" }}>
                {formatPrice(order.subtotalAmount)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between" style={{ color: "oklch(0.7 0.2 150)" }}>
                <span>Discount</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            {order.feesAmount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--pub-text-muted)" }}>Service charge</span>
                <span style={{ color: "var(--pub-text)" }}>
                  {formatPrice(order.feesAmount)}
                </span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--pub-text-muted)" }}>Tax</span>
                <span style={{ color: "var(--pub-text)" }}>
                  {formatPrice(order.taxAmount)}
                </span>
              </div>
            )}
            {order.gratuityAmount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--pub-text-muted)" }}>Gratuity</span>
                <span style={{ color: "var(--pub-text)" }}>
                  {formatPrice(order.gratuityAmount)}
                </span>
              </div>
            )}

            <div className="h-px my-3" style={{ background: "var(--pub-border)" }} />

            <div className="flex justify-between font-bold text-lg">
              <span style={{ color: "var(--pub-text)" }}>Total</span>
              <span className="gradient-text">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Tickets */}
        {ticketsList.length > 0 && (
          <div className="mb-8 animate-fade-in-up-delay-2">
            <div className="flex items-center gap-2 mb-5">
              <Ticket className="size-5" style={{ color: "var(--pub-primary)" }} />
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--pub-text)" }}
              >
                Your Tickets
              </h2>
            </div>

            <div className="space-y-4">
              {ticketsList.map((ticket) => (
                <div
                  key={ticket.id}
                  className="glass-card rounded-xl p-5"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="shrink-0 rounded-xl overflow-hidden bg-white p-2">
                      <QrCode data={ticket.qrCodeData} size={120} />
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2.5">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span
                          className="font-mono font-bold text-sm"
                          style={{ color: "var(--pub-text)" }}
                        >
                          {ticket.ticketNumber}
                        </span>
                        <span
                          className="glass-card text-xs px-2.5 py-0.5 rounded-full font-medium"
                          style={{ color: "var(--pub-accent)" }}
                        >
                          {ticket.ticketType.name}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--pub-text-muted)" }}>
                        {ticket.attendeeName}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <a
                          href={`/api/tickets/${ticket.id}/pdf`}
                          download
                          className="btn-gradient inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                        >
                          <Download className="size-3.5" />
                          Download PDF
                        </a>
                        <button
                          disabled
                          className="glass-card inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium opacity-40 cursor-not-allowed"
                          style={{ color: "var(--pub-text-muted)" }}
                        >
                          <Smartphone className="size-3.5" />
                          Apple Wallet
                        </button>
                        <button
                          disabled
                          className="glass-card inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium opacity-40 cursor-not-allowed"
                          style={{ color: "var(--pub-text-muted)" }}
                        >
                          <Smartphone className="size-3.5" />
                          Google Wallet
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Download All */}
            <div className="mt-5 text-center">
              <a
                href={`/api/tickets/download-all?orderId=${orderId}`}
                download
                className="btn-gradient inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                <Download className="size-4" />
                Download All Tickets
              </a>
            </div>
          </div>
        )}

        {/* Share section */}
        <div className="glass-card rounded-xl p-6 mb-6 text-center animate-fade-in-up-delay-3">
          <Share2
            className="mx-auto size-6 mb-3"
            style={{ color: "var(--pub-primary)" }}
          />
          <h3
            className="font-bold mb-1"
            style={{ color: "var(--pub-text)" }}
          >
            Share with friends
          </h3>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--pub-text-muted)" }}
          >
            Let others know about this event
          </p>
          <button
            onClick={handleCopyLink}
            className="glass-card inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{ color: "var(--pub-text)" }}
          >
            {linkCopied ? (
              <>
                <Check className="size-4" style={{ color: "var(--pub-primary)" }} />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="size-4" style={{ color: "var(--pub-primary)" }} />
                Copy Event Link
              </>
            )}
          </button>
        </div>

        {/* Browse more events */}
        <div className="text-center animate-fade-in-up-delay-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:gap-3"
            style={{ color: "var(--pub-primary)" }}
          >
            Browse More Events
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div
          className="max-w-lg mx-auto px-4 py-20 text-center"
          style={{ backgroundColor: "var(--pub-bg)" }}
        >
          <div className="shimmer h-20 w-20 mx-auto rounded-full mb-6" />
          <div className="shimmer h-8 w-48 mx-auto rounded-lg mb-4" />
          <div className="shimmer h-4 w-64 mx-auto rounded-lg" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
