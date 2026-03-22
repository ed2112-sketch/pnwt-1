import { z } from "zod";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../init";
import { settlements, orders } from "@/server/db/schema";

function requireAdmin(orgRole: string) {
  if (orgRole !== "owner" && orgRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only owners and admins can access settlements.",
    });
  }
}

export const settlementRouter = createRouter({
  list: orgProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.orgRole);

    return ctx.db.query.settlements.findMany({
      where: eq(settlements.organizationId, ctx.orgId),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });
  }),

  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.orgRole);

      const settlement = await ctx.db.query.settlements.findFirst({
        where: and(
          eq(settlements.id, input.id),
          eq(settlements.organizationId, ctx.orgId)
        ),
        with: {
          event: { columns: { title: true } },
        },
      });

      if (!settlement) throw new TRPCError({ code: "NOT_FOUND" });
      return settlement;
    }),

  generate: orgProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
        periodStart: z.coerce.date(),
        periodEnd: z.coerce.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.orgRole);

      const conditions = [
        eq(orders.organizationId, ctx.orgId),
        eq(orders.status, "confirmed"),
        gte(orders.createdAt, input.periodStart),
        lte(orders.createdAt, input.periodEnd),
      ];

      if (input.eventId) {
        conditions.push(eq(orders.eventId, input.eventId));
      }

      const [agg] = await ctx.db
        .select({
          grossRevenue: sql<number>`COALESCE(SUM(${orders.subtotalAmount}), 0)`,
          refunds: sql<number>`COALESCE(SUM(CASE WHEN ${orders.refundAmount} IS NOT NULL THEN ${orders.refundAmount} ELSE 0 END), 0)`,
          comps: sql<number>`COUNT(*) FILTER (WHERE ${orders.isComp} = true)`,
          serviceCharges: sql<number>`COALESCE(SUM(${orders.feesAmount}), 0)`,
          taxes: sql<number>`COALESCE(SUM(${orders.taxAmount}), 0)`,
          gratuities: sql<number>`COALESCE(SUM(${orders.gratuityAmount}), 0)`,
          promoDiscounts: sql<number>`COALESCE(SUM(${orders.discountAmount}), 0)`,
        })
        .from(orders)
        .where(and(...conditions));

      const grossRevenue = Number(agg.grossRevenue);
      const refunds = Number(agg.refunds);
      const comps = Number(agg.comps);
      const serviceCharges = Number(agg.serviceCharges);
      const taxes = Number(agg.taxes);
      const gratuities = Number(agg.gratuities);
      const promoDiscounts = Number(agg.promoDiscounts);
      const netRevenue =
        grossRevenue - promoDiscounts + serviceCharges + taxes + gratuities - refunds;

      const [settlement] = await ctx.db
        .insert(settlements)
        .values({
          organizationId: ctx.orgId,
          eventId: input.eventId ?? null,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          grossRevenue,
          refunds,
          comps,
          serviceCharges,
          taxes,
          gratuities,
          promoDiscounts,
          netRevenue,
        })
        .returning();

      return settlement;
    }),

  markPaid: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        payoutReference: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.orgRole !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners can mark settlements as paid.",
        });
      }

      const [updated] = await ctx.db
        .update(settlements)
        .set({
          payoutStatus: "paid",
          payoutDate: new Date(),
          payoutReference: input.payoutReference,
        })
        .where(
          and(
            eq(settlements.id, input.id),
            eq(settlements.organizationId, ctx.orgId)
          )
        )
        .returning();

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),
});
