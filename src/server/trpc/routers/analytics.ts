import { z } from "zod";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../init";
import { orders, tickets, events, eventTicketTypes, promoCodes, users } from "@/server/db/schema";

export const analyticsRouter = createRouter({
  orgOverview: orgProcedure.query(async ({ ctx }) => {
    const isPromoter = ctx.orgRole === "promoter";

    const [result] = await ctx.db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
        refundTotal: sql<number>`COALESCE(SUM(${orders.refundAmount}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.organizationId, ctx.orgId),
          eq(orders.status, "confirmed")
        )
      );

    const [ticketResult] = await ctx.db
      .select({
        totalTickets: sql<number>`COUNT(*)`,
      })
      .from(tickets)
      .innerJoin(orders, eq(tickets.orderId, orders.id))
      .where(
        and(
          eq(orders.organizationId, ctx.orgId),
          sql`${tickets.status} != 'cancelled'`
        )
      );

    const totalOrders = Number(result.totalOrders);
    const totalRevenue = Number(result.totalRevenue);

    return {
      totalRevenue: isPromoter ? null : totalRevenue,
      totalOrders,
      totalTickets: Number(ticketResult.totalTickets),
      avgOrderValue: isPromoter
        ? null
        : totalOrders > 0
          ? Math.round(totalRevenue / totalOrders)
          : 0,
      refundTotal: isPromoter ? null : Number(result.refundTotal),
    };
  }),

  eventBreakdown: orgProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const isPromoter = ctx.orgRole === "promoter";

      // Verify event belongs to org
      const event = await ctx.db.query.events.findFirst({
        where: and(
          eq(events.id, input.eventId),
          eq(events.organizationId, ctx.orgId)
        ),
        columns: { id: true, endDate: true },
      });

      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      // Revenue by ticket type
      const revenueByType = isPromoter
        ? []
        : await ctx.db
            .select({
              ticketTypeName: eventTicketTypes.name,
              totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
            })
            .from(orders)
            .innerJoin(tickets, eq(tickets.orderId, orders.id))
            .innerJoin(
              eventTicketTypes,
              eq(tickets.eventTicketTypeId, eventTicketTypes.id)
            )
            .where(
              and(
                eq(orders.eventId, input.eventId),
                eq(orders.organizationId, ctx.orgId),
                eq(orders.status, "confirmed")
              )
            )
            .groupBy(eventTicketTypes.name);

      // Attendance
      const now = new Date();
      const isPast = event.endDate < now;

      const [attendance] = await ctx.db
        .select({
          total: sql<number>`COUNT(*)`,
          checkedIn: sql<number>`COUNT(*) FILTER (WHERE ${tickets.status} = 'used')`,
          cancelled: sql<number>`COUNT(*) FILTER (WHERE ${tickets.status} = 'cancelled')`,
          noShows: isPast
            ? sql<number>`COUNT(*) FILTER (WHERE ${tickets.status} = 'valid')`
            : sql<number>`0`,
        })
        .from(tickets)
        .where(eq(tickets.eventId, input.eventId));

      // Promo usage
      const [promoUsage] = await ctx.db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.eventId, input.eventId),
            eq(orders.organizationId, ctx.orgId),
            sql`${orders.promoCodeId} IS NOT NULL`
          )
        );

      return {
        revenueByType: isPromoter ? null : revenueByType,
        attendance: {
          total: Number(attendance.total),
          checkedIn: Number(attendance.checkedIn),
          noShows: Number(attendance.noShows),
          cancelled: Number(attendance.cancelled),
        },
        promoUsageCount: Number(promoUsage.count),
      };
    }),

  revenueByPeriod: orgProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        granularity: z.enum(["day", "week", "month"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const isPromoter = ctx.orgRole === "promoter";

      // date_trunc needs a SQL literal for the interval, not a parameter
      const trunc =
        input.granularity === "day"
          ? sql`date_trunc('day', ${orders.createdAt})`
          : input.granularity === "week"
            ? sql`date_trunc('week', ${orders.createdAt})`
            : sql`date_trunc('month', ${orders.createdAt})`;

      const rows = await ctx.db
        .select({
          period: sql<string>`${trunc}::text`,
          revenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
          orderCount: sql<number>`COUNT(*)::int`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.organizationId, ctx.orgId),
            eq(orders.status, "confirmed"),
            gte(orders.createdAt, input.startDate),
            lte(orders.createdAt, input.endDate)
          )
        )
        .groupBy(trunc)
        .orderBy(trunc);

      return rows.map((row) => ({
        period: row.period,
        revenue: isPromoter ? null : row.revenue,
        orders: row.orderCount,
      }));
    }),

  promoEffectiveness: orgProcedure.query(async ({ ctx }) => {
    if (ctx.orgRole === "promoter") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Promoters cannot access promo effectiveness data.",
      });
    }

    const rows = await ctx.db
      .select({
        code: promoCodes.code,
        usageCount: sql<number>`COUNT(${orders.id})`,
        totalDiscount: sql<number>`COALESCE(SUM(${orders.discountAmount}), 0)`,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
      })
      .from(orders)
      .innerJoin(promoCodes, eq(orders.promoCodeId, promoCodes.id))
      .where(
        and(
          eq(orders.organizationId, ctx.orgId),
          sql`${orders.promoCodeId} IS NOT NULL`
        )
      )
      .groupBy(promoCodes.code)
      .orderBy(desc(sql`COUNT(${orders.id})`));

    return rows.map((row) => ({
      code: row.code,
      usageCount: Number(row.usageCount),
      totalDiscount: Number(row.totalDiscount),
      totalRevenue: Number(row.totalRevenue),
    }));
  }),

  customerOverview: orgProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(10),
        sortBy: z.enum(["orders", "spent"]).default("orders"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const sortBy = input?.sortBy ?? "orders";

      const orderByExpr = sortBy === "orders"
        ? desc(sql`COUNT(*)`)
        : desc(sql`COALESCE(SUM(${orders.totalAmount}), 0)`);

      const rows = await ctx.db
        .select({
          name: orders.name,
          email: orders.email,
          totalSpent: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
          orderCount: sql<number>`COUNT(*)::int`,
          lastOrderAt: sql<string>`MAX(${orders.createdAt})::text`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.organizationId, ctx.orgId),
            eq(orders.status, "confirmed")
          )
        )
        .groupBy(orders.email, orders.name)
        .orderBy(orderByExpr)
        .limit(limit);

      return rows.map((row) => ({
        name: row.name,
        email: row.email,
        totalSpent: row.totalSpent,
        orderCount: row.orderCount,
        lastOrderAt: row.lastOrderAt,
      }));
    }),

  customerSegments: orgProcedure.query(async ({ ctx }) => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Get all customer stats for this org — from orders directly, no user account needed
    const customerStats = await ctx.db
      .select({
        email: orders.email,
        totalSpent: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::int`,
        totalOrders: sql<number>`COUNT(*)::int`,
        lastOrderAt: sql<Date>`MAX(${orders.createdAt})`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.organizationId, ctx.orgId),
          eq(orders.status, "confirmed")
        )
      )
      .groupBy(orders.email);

    let vip = 0;
    let regular = 0;
    let newCustomers = 0;
    let inactive = 0;

    for (const c of customerStats) {
      const spent = Number(c.totalSpent);
      const orderCount = Number(c.totalOrders);
      const lastOrder = c.lastOrderAt ? new Date(c.lastOrderAt) : null;

      if (spent >= 50000) {
        vip++;
      } else if (spent >= 10000) {
        regular++;
      } else if (orderCount === 1) {
        newCustomers++;
      }

      if (lastOrder && lastOrder < ninetyDaysAgo) {
        inactive++;
      }
    }

    return {
      vip,
      regular,
      new: newCustomers,
      inactive,
      total: customerStats.length,
    };
  }),
});
