import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../init";
import { eventTicketTypes, events } from "@/server/db/schema";

export const eventTicketTypeRouter = createRouter({
  list: orgProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify event belongs to org
      const event = await ctx.db.query.events.findFirst({
        where: and(eq(events.id, input.eventId), eq(events.organizationId, ctx.orgId)),
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.query.eventTicketTypes.findMany({
        where: eq(eventTicketTypes.eventId, input.eventId),
        orderBy: (tt, { asc }) => [asc(tt.sortOrder)],
      });
    }),

  create: orgProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        price: z.number().int().min(0),
        quantity: z.number().int().positive(),
        sortOrder: z.number().int().default(0),
        saleStart: z.coerce.date().optional(),
        saleEnd: z.coerce.date().optional(),
        settings: z
          .object({ maxPerOrder: z.number().int().positive().optional() })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: and(eq(events.id, input.eventId), eq(events.organizationId, ctx.orgId)),
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      const [ticketType] = await ctx.db
        .insert(eventTicketTypes)
        .values(input)
        .returning();

      return ticketType;
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional().nullable(),
        price: z.number().int().min(0).optional(),
        quantity: z.number().int().positive().optional(),
        sortOrder: z.number().int().optional(),
        saleStart: z.coerce.date().optional().nullable(),
        saleEnd: z.coerce.date().optional().nullable(),
        isActive: z.boolean().optional(),
        settings: z
          .object({ maxPerOrder: z.number().int().positive().optional() })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership through event
      const ticketType = await ctx.db.query.eventTicketTypes.findFirst({
        where: eq(eventTicketTypes.id, id),
        with: { event: { columns: { organizationId: true } } },
      });

      if (!ticketType || ticketType.event.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updated] = await ctx.db
        .update(eventTicketTypes)
        .set(data)
        .where(eq(eventTicketTypes.id, id))
        .returning();

      return updated;
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ticketType = await ctx.db.query.eventTicketTypes.findFirst({
        where: eq(eventTicketTypes.id, input.id),
        with: { event: { columns: { organizationId: true } } },
      });

      if (!ticketType || ticketType.event.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (ticketType.quantitySold > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot delete a ticket type with sales.",
        });
      }

      await ctx.db.delete(eventTicketTypes).where(eq(eventTicketTypes.id, input.id));
      return { success: true };
    }),

  reorder: orgProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        orderedIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: and(eq(events.id, input.eventId), eq(events.organizationId, ctx.orgId)),
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      await Promise.all(
        input.orderedIds.map((id, index) =>
          ctx.db
            .update(eventTicketTypes)
            .set({ sortOrder: index })
            .where(
              and(
                eq(eventTicketTypes.id, id),
                eq(eventTicketTypes.eventId, input.eventId)
              )
            )
        )
      );

      return { success: true };
    }),
});
