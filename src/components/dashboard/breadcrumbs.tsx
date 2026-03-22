"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  events: "Events",
  venues: "Venues",
  orders: "Orders",
  analytics: "Analytics",
  settings: "Settings",
  calendar: "Calendar",
  "gift-cards": "Gift Cards",
  campaigns: "Campaigns",
  checkin: "Check-in",
  attendees: "Attendees",
  pricing: "Pricing",
  runsheet: "Runsheet",
  tickets: "Tickets",
  waitlist: "Waitlist",
  comp: "Comp",
  edit: "Edit",
  widget: "Widget",
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; href: string }[] = [];
  let accumulated = "";

  for (const segment of segments) {
    accumulated += `/${segment}`;

    if (uuidRegex.test(segment)) {
      crumbs.push({ label: "Detail", href: accumulated });
      continue;
    }

    const label = segmentLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: accumulated });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-4">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="size-3.5 text-muted-foreground/40" />
            )}
            {isLast ? (
              <span className="text-foreground font-medium">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
