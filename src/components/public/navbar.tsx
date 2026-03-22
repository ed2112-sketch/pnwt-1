"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(18,17,16,0.95)" : "transparent",
        borderBottom: scrolled
          ? "1px solid var(--pub-border)"
          : "1px solid transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "var(--pub-text)" }}>
              PNW<span style={{ color: "var(--pub-warm)" }}>T</span>
            </span>
          </Link>

          {/* Desktop nav — center */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/discover"
              className="text-sm font-medium text-[#9e9a93] hover:text-[#c4a882] transition-colors duration-200"
            >
              Events
            </Link>
            <Link
              href="/v"
              className="text-sm font-medium text-[#9e9a93] hover:text-[#c4a882] transition-colors duration-200"
            >
              Venues
            </Link>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center">
            <Link
              href="/login"
              className="text-sm font-medium text-[#9e9a93] hover:text-[#c4a882] transition-colors duration-200"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ backgroundColor: "rgba(18,17,16,0.98)" }}
      >
        <div className="px-6 pb-6 pt-2 space-y-1">
          <Link
            href="/discover"
            className="block py-3 text-sm font-medium text-[#a1a1a1]"
            onClick={() => setMobileOpen(false)}
          >
            Events
          </Link>
          <Link
            href="/v"
            className="block py-3 text-sm font-medium text-[#a1a1a1]"
            onClick={() => setMobileOpen(false)}
          >
            Venues
          </Link>
          <Link
            href="/login"
            className="block py-3 text-sm font-medium text-[#a1a1a1]"
            onClick={() => setMobileOpen(false)}
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}
