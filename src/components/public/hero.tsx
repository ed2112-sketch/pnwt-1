import Link from "next/link";

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-28"
      style={{ backgroundColor: "var(--pub-bg)" }}
    >
      {/* Atmospheric stage lighting — two warm sources */}
      <div className="hero-atmosphere" />

      {/* Secondary subtle side light — asymmetric, like a real stage */}
      <div
        className="absolute top-[20%] right-[-10%] w-[50%] h-[60%] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(196,168,130,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Eyebrow */}
        <div className="animate-fade-in">
          <span
            className="inline-flex items-center px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] font-medium"
            style={{
              color: "var(--pub-warm)",
              border: "1px solid rgba(196,168,130,0.15)",
              background: "rgba(196,168,130,0.04)",
            }}
          >
            Live Entertainment &nbsp;&middot;&nbsp; Chehalis, WA
          </span>
        </div>

        {/* Headline — the single most important element on the page */}
        <h1
          className="mt-12 md:mt-16 font-extrabold tracking-[-0.05em] leading-[0.82] animate-fade-in-delay-1"
          style={{ color: "var(--pub-text)" }}
        >
          {/* Stacked with intentional size difference for visual rhythm */}
          <span className="block text-5xl sm:text-6xl md:text-8xl lg:text-[140px]">
            PNW
          </span>
          <span
            className="block text-5xl sm:text-6xl md:text-8xl lg:text-[140px] mt-[-0.05em]"
            style={{ color: "var(--pub-warm)", opacity: 0.9 }}
          >
            Tickets
          </span>
        </h1>

        {/* Warm accent line — perfectly measured */}
        <div className="warm-line w-16 mx-auto mt-10 animate-fade-in-delay-2" />

        {/* Subline — measured, poetic */}
        <p
          className="mt-8 text-[17px] md:text-xl font-light max-w-md mx-auto leading-[1.7] animate-fade-in-delay-2"
          style={{ color: "var(--pub-text-secondary)" }}
        >
          Concerts, comedy, dinner theater,
          <br />
          and nights you&apos;ll never forget.
        </p>

        {/* CTA — single, decisive */}
        <div className="mt-14 animate-fade-in-delay-3">
          <Link
            href="/discover"
            className="btn-primary inline-flex items-center gap-2 px-10 py-[18px] rounded-full text-[15px] font-medium tracking-[-0.01em]"
          >
            <span>Explore Events</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-[1px]">
              <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Venues — three pillars */}
        <div className="mt-20 animate-fade-in-delay-4">
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12"
            style={{ color: "var(--pub-text-muted)" }}
          >
            <div className="text-center">
              <p className="text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: "var(--pub-text-secondary)" }}>
                The Chehalis Theater
              </p>
              <p className="text-[10px] tracking-[0.1em] uppercase mt-1">Live Music &amp; Shows</p>
            </div>
            <div
              className="hidden sm:block w-px h-8"
              style={{ background: "var(--pub-border-hover)" }}
            />
            <div className="text-center">
              <p className="text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: "var(--pub-text-secondary)" }}>
                McFiler&apos;s
              </p>
              <p className="text-[10px] tracking-[0.1em] uppercase mt-1">Restaurant &amp; Bar</p>
            </div>
            <div
              className="hidden sm:block w-px h-8"
              style={{ background: "var(--pub-border-hover)" }}
            />
            <div className="text-center">
              <p className="text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: "var(--pub-text-secondary)" }}>
                The Hub
              </p>
              <p className="text-[10px] tracking-[0.1em] uppercase mt-1">Restaurant &amp; Bar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade into content */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-20"
        style={{ background: "linear-gradient(to top, var(--pub-bg), transparent)" }}
      />
    </section>
  );
}
