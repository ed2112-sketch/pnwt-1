import { z } from "zod";
import { eq, and, gte, ilike, sql, desc, asc } from "drizzle-orm";
import { createRouter, publicProcedure } from "../init";
import { events, venues, eventTicketTypes } from "@/server/db/schema";

export const discoverRouter = createRouter({
  featuredEvents: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    return ctx.db.query.events.findMany({
      where: and(
        eq(events.status, "published"),
        eq(events.isFeatured, true),
        eq(events.isHidden, false),
        gte(events.startDate, now)
      ),
      with: {
        venue: { columns: { id: true, name: true, slug: true, city: true, state: true } },
        ticketTypes: {
          where: eq(eventTicketTypes.isActive, true),
          columns: { price: true, quantity: true, quantitySold: true },
        },
      },
      orderBy: [asc(events.startDate)],
      limit: 6,
    });
  }),

  upcomingEvents: publicProcedure
    .input(
      z.object({
        venueId: z.string().uuid().optional(),
        eventType: z
          .enum(["concert", "show", "dinner_theater", "comedy", "private", "other"])
          .optional(),
        cursor: z.number().int().min(0).default(0),
        limit: z.number().int().min(1).max(50).default(12),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const conditions = [
        eq(events.status, "published"),
        eq(events.isHidden, false),
        gte(events.startDate, now),
      ];

      if (input?.venueId) conditions.push(eq(events.venueId, input.venueId));
      if (input?.eventType) conditions.push(eq(events.eventType, input.eventType));

      const limit = input?.limit ?? 12;
      const offset = input?.cursor ?? 0;

      const results = await ctx.db.query.events.findMany({
        where: and(...conditions),
        with: {
          venue: { columns: { id: true, name: true, slug: true, city: true, state: true } },
          ticketTypes: {
            where: eq(eventTicketTypes.isActive, true),
            columns: { price: true, quantity: true, quantitySold: true },
          },
        },
        orderBy: [asc(events.startDate)],
        limit: limit + 1, // fetch one extra to check if more
        offset,
      });

      const hasMore = results.length > limit;
      const items = hasMore ? results.slice(0, limit) : results;

      return { items, hasMore, nextCursor: hasMore ? offset + limit : null };
    }),

  venues: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const venueList = await ctx.db.query.venues.findMany({
      where: eq(venues.isActive, true),
      with: {
        events: {
          where: and(
            eq(events.status, "published"),
            eq(events.isHidden, false),
            gte(events.startDate, now)
          ),
          columns: { id: true },
        },
      },
      orderBy: [asc(venues.name)],
    });

    return venueList.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      type: v.type,
      description: v.description,
      address: v.address,
      city: v.city,
      state: v.state,
      imageUrl: v.imageUrl,
      capacity: v.capacity,
      upcomingEventCount: v.events.length,
    }));
  }),

  venueBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const venue = await ctx.db.query.venues.findFirst({
        where: and(eq(venues.slug, input.slug), eq(venues.isActive, true)),
        with: {
          events: {
            where: and(
              eq(events.status, "published"),
              eq(events.isHidden, false),
              gte(events.startDate, now)
            ),
            with: {
              ticketTypes: {
                where: eq(eventTicketTypes.isActive, true),
                columns: { price: true, quantity: true, quantitySold: true },
              },
            },
            orderBy: [asc(events.startDate)],
          },
        },
      });
      return venue;
    }),

  searchEvents: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      return ctx.db.query.events.findMany({
        where: and(
          eq(events.status, "published"),
          eq(events.isHidden, false),
          gte(events.startDate, now),
          ilike(events.title, `%${input.query}%`)
        ),
        with: {
          venue: { columns: { id: true, name: true, slug: true, city: true, state: true } },
          ticketTypes: {
            where: eq(eventTicketTypes.isActive, true),
            columns: { price: true, quantity: true, quantitySold: true },
          },
        },
        orderBy: [asc(events.startDate)],
        limit: 20,
      });
    }),
});
