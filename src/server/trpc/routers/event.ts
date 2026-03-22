import { z } from "zod";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../init";
import { events, venues } from "@/server/db/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export const eventRouter = createRouter({
  list: orgProcedure
    .input(
      z
        .object({
          venueId: z.string().uuid().optional(),
          status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
          startAfter: z.date().optional(),
          startBefore: z.date().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(events.organizationId, ctx.orgId)];

      if (input?.venueId) conditions.push(eq(events.venueId, input.venueId));
      if (input?.status) conditions.push(eq(events.status, input.status));
      if (input?.startAfter) conditions.push(gte(events.startDate, input.startAfter));
      if (input?.startBefore) conditions.push(lte(events.startDate, input.startBefore));

      return ctx.db.query.events.findMany({
        where: and(...conditions),
        with: {
          venue: { columns: { id: true, name: true, slug: true } },
        },
        orderBy: (e, { desc }) => [desc(e.startDate)],
      });
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: and(eq(events.id, input.id), eq(events.organizationId, ctx.orgId)),
        with: {
          venue: { columns: { id: true, name: true, slug: true } },
          ticketTypes: { orderBy: (tt, { asc }) => [asc(tt.sortOrder)] },
        },
      });

      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      return event;
    }),

  create: orgProcedure
    .input(
      z.object({
        venueId: z.string().uuid(),
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
        description: z.string().optional(),
        shortDescription: z.string().max(300).optional(),
        eventType: z.enum(["concert", "show", "dinner_theater", "comedy", "private", "other"]).default("other"),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        doorsOpen: z.coerce.date().optional(),
        imageUrl: z.string().url().optional(),
        isFeatured: z.boolean().default(false),
        settings: z
          .object({
            ageRestriction: z.string().optional(),
            dinnerIncluded: z.boolean().optional(),
            dresscode: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify venue belongs to org
      const venue = await ctx.db.query.venues.findFirst({
        where: and(eq(venues.id, input.venueId), eq(venues.organizationId, ctx.orgId)),
      });
      if (!venue) throw new TRPCError({ code: "NOT_FOUND", message: "Venue not found." });

      const slug = input.slug ?? slugify(input.title) + "-" + Date.now().toString(36);

      const [event] = await ctx.db
        .insert(events)
        .values({
          ...input,
          slug,
          organizationId: ctx.orgId,
        })
        .returning();

      return event;
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
        description: z.string().optional().nullable(),
        shortDescription: z.string().max(300).optional().nullable(),
        eventType: z.enum(["concert", "show", "dinner_theater", "comedy", "private", "other"]).optional(),
        status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        doorsOpen: z.coerce.date().optional().nullable(),
        imageUrl: z.string().url().optional().nullable(),
        isFeatured: z.boolean().optional(),
        isHidden: z.boolean().optional(),
        settings: z
          .object({
            ageRestriction: z.string().optional(),
            dinnerIncluded: z.boolean().optional(),
            dresscode: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(events)
        .set(data)
        .where(and(eq(events.id, id), eq(events.organizationId, ctx.orgId)))
        .returning();

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(events)
        .where(and(eq(events.id, input.id), eq(events.organizationId, ctx.orgId)))
        .returning();

      if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),

  listForCalendar: orgProcedure
    .input(
      z.object({
        month: z.number().int().min(0).max(11),
        year: z.number().int(),
        venueId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startOfMonth = new Date(input.year, input.month, 1);
      const endOfMonth = new Date(input.year, input.month + 1, 0, 23, 59, 59);

      const conditions = [
        eq(events.organizationId, ctx.orgId),
        gte(events.startDate, startOfMonth),
        lte(events.startDate, endOfMonth),
      ];

      if (input.venueId) conditions.push(eq(events.venueId, input.venueId));

      return ctx.db.query.events.findMany({
        where: and(...conditions),
        columns: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          status: true,
          eventType: true,
        },
        with: {
          venue: { columns: { id: true, name: true, slug: true } },
        },
        orderBy: (e, { asc }) => [asc(e.startDate)],
      });
    }),
});
