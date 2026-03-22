"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--pub-bg)" }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Warm line */}
        <div className="warm-line" />

        <div className="py-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Left */}
          <div>
            <span
              className="text-sm font-bold tracking-[0.2em] uppercase"
              style={{ color: "var(--pub-text)" }}
            >
              PNWT
            </span>
            <p className="mt-2 text-xs" style={{ color: "var(--pub-text-muted)" }}>
              &copy; {new Date().getFullYear()} PNWTickets &middot; Chehalis, WA
            </p>
          </div>

          {/* Right */}
          <div className="flex items-center gap-8">
            {[
              { href: "/discover", label: "Events" },
              { href: "/v", label: "Venues" },
              { href: "/login", label: "Sign In" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors duration-300"
                style={{ color: "var(--pub-text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--pub-warm)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--pub-text-muted)")}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
