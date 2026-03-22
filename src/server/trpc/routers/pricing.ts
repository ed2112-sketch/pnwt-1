import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../init";
import { pricingTiers, eventTicketTypes, events } from "@/server/db/schema";

export const pricingRouter = createRouter({
  list: orgProcedure
    .input(z.object({ eventTicketTypeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const tt = await ctx.db.query.eventTicketTypes.findFirst({
        where: eq(eventTicketTypes.id, input.eventTicketTypeId),
        with: { event: { columns: { organizationId: true } } },
      });
      if (!tt || tt.event.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.query.pricingTiers.findMany({
        where: eq(pricingTiers.eventTicketTypeId, input.eventTicketTypeId),
        orderBy: (t, { asc }) => [asc(t.sortOrder)],
      });
    }),

  create: orgProcedure
    .input(
      z.object({
        eventTicketTypeId: z.string().uuid(),
        name: z.string().min(1).max(100),
        type: z.enum(["time_based", "demand_based"]),
        price: z.number().int().min(0),
        startsAt: z.coerce.date().optional(),
        endsAt: z.coerce.date().optional(),
        minPercentSold: z.number().int().min(0).max(100).optional(),
        maxPercentSold: z.number().int().min(0).max(100).optional(),
        sortOrder: z.number().int().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tt = await ctx.db.query.eventTicketTypes.findFirst({
        where: eq(eventTicketTypes.id, input.eventTicketTypeId),
        with: { event: { columns: { organizationId: true } } },
      });
      if (!tt || tt.event.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [tier] = await ctx.db
        .insert(pricingTiers)
        .values(input)
        .returning();

      return tier;
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        price: z.number().int().min(0).optional(),
        startsAt: z.coerce.date().optional().nullable(),
        endsAt: z.coerce.date().optional().nullable(),
        minPercentSold: z.number().int().min(0).max(100).optional().nullable(),
        maxPercentSold: z.number().int().min(0).max(100).optional().nullable(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const tier = await ctx.db.query.pricingTiers.findFirst({
        where: eq(pricingTiers.id, id),
        with: {
          ticketType: {
            with: { event: { columns: { organizationId: true } } },
          },
        },
      });
      if (!tier || tier.ticketType.event.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updated] = await ctx.db
        .update(pricingTiers)
        .set(data)
        .where(eq(pricingTiers.id, id))
        .returning();

      return updated;
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const tier = await ctx.db.query.pricingTiers.findFirst({
        where: eq(pricingTiers.id, input.id),
        with: {
          ticketType: {
            with: { event: { columns: { organizationId: true } } },
          },
        },
      });
      if (!tier || tier.ticketType.event.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.delete(pricingTiers).where(eq(pricingTiers.id, input.id));
      return { success: true };
    }),
});
