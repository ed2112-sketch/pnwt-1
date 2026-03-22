import { z } from "zod";
import { eq, and, sql, max } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicProcedure, orgProcedure } from "../init";
import { waitlistEntries, events, eventTicketTypes } from "@/server/db/schema";
import { sendWaitlistNotificationEmail } from "@/server/email";

export const waitlistRouter = createRouter({
  join: publicProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        eventTicketTypeId: z.string().uuid().optional(),
        email: z.string().email(),
        name: z.string().min(1),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check event is published
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        columns: { id: true, status: true, organizationId: true },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
      }

      if (event.status !== "published") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Event is not currently published.",
        });
      }

      // Check if sold out (at least one ticket type should be at capacity)
      const ticketTypes = await ctx.db.query.eventTicketTypes.findMany({
        where: eq(eventTicketTypes.eventId, input.eventId),
        columns: { id: true, quantity: true, quantitySold: true, isActive: true },
      });

      const relevantTypes = input.eventTicketTypeId
        ? ticketTypes.filter((tt) => tt.id === input.eventTicketTypeId)
        : ticketTypes.filter((tt) => tt.isActive);

      const allSoldOut = relevantTypes.every(
        (tt) => tt.quantitySold >= tt.quantity
      );

      if (!allSoldOut) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tickets are still available. No need to join the waitlist.",
        });
      }

      // Check for duplicate entry
      const duplicateConditions = [
        eq(waitlistEntries.email, input.email),
        eq(waitlistEntries.eventId, input.eventId),
        eq(waitlistEntries.status, "waiting"),
      ];
      if (input.eventTicketTypeId) {
        duplicateConditions.push(
          eq(waitlistEntries.eventTicketTypeId, input.eventTicketTypeId)
        );
      }

      const existing = await ctx.db.query.waitlistEntries.findFirst({
        where: and(...duplicateConditions),
        columns: { id: true },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already on the waitlist for this event.",
        });
      }

      // Compute priority (max existing + 1)
      const [result] = await ctx.db
        .select({ maxPriority: max(waitlistEntries.priority) })
        .from(waitlistEntries)
        .where(eq(waitlistEntries.eventId, input.eventId));

      const priority = (result?.maxPriority ?? 0) + 1;

      // Insert
      await ctx.db.insert(waitlistEntries).values({
        eventId: input.eventId,
        eventTicketTypeId: input.eventTicketTypeId,
        organizationId: event.organizationId,
        email: input.email,
        name: input.name,
        phone: input.phone,
        priority,
      });

      return { success: true };
    }),

  listByEvent: orgProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        status: z
          .enum(["waiting", "notified", "converted", "expired"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify event belongs to org
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        columns: { id: true, organizationId: true },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
      }

      if (event.organizationId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Event does not belong to your organization.",
        });
      }

      const conditions = [eq(waitlistEntries.eventId, input.eventId)];
      if (input.status) {
        conditions.push(eq(waitlistEntries.status, input.status));
      }

      return ctx.db.query.waitlistEntries.findMany({
        where: and(...conditions),
        with: {
          ticketType: { columns: { name: true } },
        },
        orderBy: (w, { asc }) => [asc(w.priority)],
      });
    }),

  remove: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify org ownership through the entry's event
      const entry = await ctx.db.query.waitlistEntries.findFirst({
        where: eq(waitlistEntries.id, input.id),
        with: {
          event: { columns: { id: true, organizationId: true } },
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Waitlist entry not found.",
        });
      }

      if (entry.event.organizationId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This entry does not belong to your organization.",
        });
      }

      await ctx.db
        .delete(waitlistEntries)
        .where(eq(waitlistEntries.id, input.id));

      return { success: true };
    }),

  notifyNext: orgProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        eventTicketTypeId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify event belongs to org
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        columns: { id: true, organizationId: true, title: true, startDate: true },
        with: { venue: { columns: { name: true } } },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
      }

      if (event.organizationId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Event does not belong to your organization.",
        });
      }

      // Find first "waiting" entry matching criteria
      const conditions = [
        eq(waitlistEntries.eventId, input.eventId),
        eq(waitlistEntries.status, "waiting"),
      ];
      if (input.eventTicketTypeId) {
        conditions.push(
          eq(waitlistEntries.eventTicketTypeId, input.eventTicketTypeId)
        );
      }

      const entry = await ctx.db.query.waitlistEntries.findFirst({
        where: and(...conditions),
        orderBy: (w, { asc }) => [asc(w.priority)],
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No waiting entries found.",
        });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      await ctx.db
        .update(waitlistEntries)
        .set({ status: "notified", notifiedAt: now, expiresAt })
        .where(eq(waitlistEntries.id, entry.id));

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pnwtickets.com";

      await sendWaitlistNotificationEmail({
        to: entry.email,
        name: entry.name,
        eventTitle: event.title,
        eventDate: event.startDate,
        venueName: event.venue.name,
        purchaseUrl: `${appUrl}/e/${event.id}`,
        expiresAt,
      });

      return { ...entry, status: "notified" as const, notifiedAt: now, expiresAt };
    }),

  checkExpired: orgProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify event belongs to org
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        columns: { id: true, organizationId: true },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
      }

      if (event.organizationId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Event does not belong to your organization.",
        });
      }

      const result = await ctx.db
        .update(waitlistEntries)
        .set({ status: "expired" })
        .where(
          and(
            eq(waitlistEntries.eventId, input.eventId),
            eq(waitlistEntries.status, "notified"),
            sql`${waitlistEntries.expiresAt} < NOW()`
          )
        )
        .returning({ id: waitlistEntries.id });

      return { count: result.length };
    }),
});
