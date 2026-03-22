import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { events, eventTicketTypes, venues, organizations } from "@/server/db/schema";
import { eq, and, gte, asc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const orgSlug = searchParams.get("org");
  const venueSlug = searchParams.get("venue");
  const eventSlugs = searchParams.get("events"); // comma-separated event slugs
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "6"), 1), 20);

  if (!orgSlug) {
    return NextResponse.json({ error: "Missing org parameter" }, { status: 400 });
  }

  // Find organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
    columns: { id: true, name: true, slug: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Find venue if specified
  let venueId: string | undefined;
  if (venueSlug) {
    const venue = await db.query.venues.findFirst({
      where: and(eq(venues.slug, venueSlug), eq(venues.organizationId, org.id)),
      columns: { id: true },
    });
    if (venue) venueId = venue.id;
  }

  // Fetch upcoming published events
  const now = new Date();
  const conditions = [
    eq(events.organizationId, org.id),
    eq(events.status, "published"),
    eq(events.isHidden, false),
    gte(events.startDate, now),
  ];
  if (venueId) conditions.push(eq(events.venueId, venueId));
  if (eventSlugs) {
    const slugList = eventSlugs.split(",").map((s) => s.trim()).filter(Boolean);
    if (slugList.length > 0) conditions.push(inArray(events.slug, slugList));
  }

  const eventList = await db.query.events.findMany({
    where: and(...conditions),
    with: {
      venue: { columns: { name: true, slug: true } },
      ticketTypes: {
        where: eq(eventTicketTypes.isActive, true),
        columns: { id: true, name: true, description: true, price: true, quantity: true, quantitySold: true },
        orderBy: [asc(eventTicketTypes.sortOrder)],
      },
    },
    orderBy: [asc(events.startDate)],
    limit,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const result = {
    events: eventList.map((e) => {
      const prices = e.ticketTypes.map((t) => t.price);
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const totalRemaining = e.ticketTypes.reduce(
        (sum, t) => sum + (t.quantity - t.quantitySold),
        0
      );

      return {
        title: e.title,
        slug: e.slug,
        imageUrl: e.imageUrl,
        startDate: e.startDate.toISOString(),
        eventType: e.eventType,
        venue: { name: e.venue.name },
        minPrice,
        soldOut: e.ticketTypes.length > 0 && totalRemaining <= 0,
        ticketTypes: e.ticketTypes.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          remaining: t.quantity - t.quantitySold,
        })),
      };
    }),
    org: { name: org.name, slug: org.slug },
    baseUrl,
  };

  return NextResponse.json(result, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
