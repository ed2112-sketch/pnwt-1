import { z } from "zod";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicProcedure, orgProcedure } from "../init";
import { tickets, events, eventTicketTypes } from "@/server/db/schema";

export const ticketRouter = createRouter({
  getByOrderId: publicProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.tickets.findMany({
        where: eq(tickets.orderId, input.orderId),
        with: {
          ticketType: { columns: { name: true } },
        },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      });
    }),

  verify: publicProcedure
    .input(z.object({ qrCodeData: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.db.query.tickets.findFirst({
        where: eq(tickets.qrCodeData, input.qrCodeData),
        with: {
          event: { columns: { id: true, title: true, startDate: true } },
          ticketType: { columns: { name: true } },
        },
      });

      if (!ticket) {
        return { valid: false, message: "Ticket not found." } as const;
      }

      if (ticket.status === "cancelled") {
        return { valid: false, message: "This ticket has been cancelled." } as const;
      }

      if (ticket.status === "used") {
        return {
          valid: false,
          message: "This ticket has already been checked in.",
          ticket: {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            status: ticket.status,
            attendeeName: ticket.attendeeName,
            checkedInAt: ticket.checkedInAt,
            event: ticket.event,
            ticketType: ticket.ticketType,
          },
        } as const;
      }

      return {
        valid: true,
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          attendeeName: ticket.attendeeName,
          event: ticket.event,
          ticketType: ticket.ticketType,
        },
      } as const;
    }),

  checkIn: orgProcedure
    .input(z.object({ ticketId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.db.query.tickets.findFirst({
        where: eq(tickets.id, input.ticketId),
        with: {
          event: { columns: { id: true, organizationId: true } },
        },
      });

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found." });
      }

      if (ticket.event.organizationId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This ticket does not belong to your organization.",
        });
      }

      if (ticket.status === "used") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ticket has already been checked in.",
        });
      }

      if (ticket.status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ticket has been cancelled.",
        });
      }

      await ctx.db
        .update(tickets)
        .set({ status: "used", checkedInAt: new Date() })
        .where(eq(tickets.id, input.ticketId));

      return { success: true };
    }),

  listByEvent: orgProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        search: z.string().optional(),
        status: z.enum(["valid", "used", "cancelled"]).optional(),
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

      const conditions = [eq(tickets.eventId, input.eventId)];

      if (input.search) {
        const pattern = `%${input.search}%`;
        conditions.push(
          or(
            ilike(tickets.attendeeName, pattern),
            ilike(tickets.attendeeEmail, pattern),
            ilike(tickets.ticketNumber, pattern)
          )!
        );
      }

      if (input.status) {
        conditions.push(eq(tickets.status, input.status));
      }

      const ticketList = await ctx.db.query.tickets.findMany({
        where: and(...conditions),
        with: {
          ticketType: { columns: { name: true } },
        },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });

      // Compute stats via aggregation
      const [stats] = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          checkedIn: sql<number>`count(*) filter (where ${tickets.status} = 'used')::int`,
          cancelled: sql<number>`count(*) filter (where ${tickets.status} = 'cancelled')::int`,
        })
        .from(tickets)
        .where(eq(tickets.eventId, input.eventId));

      return {
        tickets: ticketList,
        stats: {
          total: stats?.total ?? 0,
          checkedIn: stats?.checkedIn ?? 0,
          cancelled: stats?.cancelled ?? 0,
          remaining: (stats?.total ?? 0) - (stats?.checkedIn ?? 0) - (stats?.cancelled ?? 0),
        },
      };
    }),

  getCheckInStats: orgProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        columns: { id: true, organizationId: true, title: true, startDate: true, doorsOpen: true },
        with: { venue: { columns: { name: true, capacity: true } } },
      });

      if (!event || event.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [stats] = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          checkedIn: sql<number>`count(*) filter (where ${tickets.status} = 'used')::int`,
          cancelled: sql<number>`count(*) filter (where ${tickets.status} = 'cancelled')::int`,
        })
        .from(tickets)
        .where(eq(tickets.eventId, input.eventId));

      const total = stats?.total ?? 0;
      const checkedIn = stats?.checkedIn ?? 0;
      const cancelled = stats?.cancelled ?? 0;
      const active = total - cancelled;
      const rate = active > 0 ? Math.round((checkedIn / active) * 100) : 0;

      return {
        total,
        checkedIn,
        cancelled,
        remaining: active - checkedIn,
        rate,
        event: {
          title: event.title,
          startDate: event.startDate,
          doorsOpen: event.doorsOpen,
          venueName: event.venue.name,
          venueCapacity: event.venue.capacity,
        },
      };
    }),

  getRecentCheckIns: orgProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        columns: { id: true, organizationId: true },
      });

      if (!event || event.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.query.tickets.findMany({
        where: and(
          eq(tickets.eventId, input.eventId),
          eq(tickets.status, "used")
        ),
        with: { ticketType: { columns: { name: true } } },
        orderBy: (t, { desc }) => [desc(t.checkedInAt)],
        limit: input.limit,
      });
    }),

  updateAttendee: orgProcedure
    .input(
      z.object({
        ticketId: z.string().uuid(),
        attendeeName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ticket's event belongs to org
      const ticket = await ctx.db.query.tickets.findFirst({
        where: eq(tickets.id, input.ticketId),
        with: {
          event: { columns: { id: true, organizationId: true } },
        },
      });

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found." });
      }

      if (ticket.event.organizationId !== ctx.orgId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This ticket does not belong to your organization.",
        });
      }

      const [updated] = await ctx.db
        .update(tickets)
        .set({ attendeeName: input.attendeeName })
        .where(eq(tickets.id, input.ticketId))
        .returning();

      return updated;
    }),
});
