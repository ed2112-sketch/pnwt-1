import { z } from "zod";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../init";
import {
  orders,
  orderItems,
  eventTicketTypes,
  promoCodes,
  tickets,
  events,
  waitlistEntries,
} from "@/server/db/schema";
import { generateTicketsForOrder } from "@/lib/tickets";
import { sendOrderConfirmationEmail } from "@/server/email";

export const orderRouter = createRouter({
  list: orgProcedure
    .input(
      z
        .object({
          eventId: z.string().uuid().optional(),
          status: z.enum(["pending", "confirmed", "cancelled", "refunded"]).optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(orders.organizationId, ctx.orgId)];
      if (input?.eventId) conditions.push(eq(orders.eventId, input.eventId));
      if (input?.status) conditions.push(eq(orders.status, input.status));
      if (input?.search) {
        const pattern = `%${input.search}%`;
        conditions.push(
          or(ilike(orders.name, pattern), ilike(orders.email, pattern))!
        );
      }

      return ctx.db.query.orders.findMany({
        where: and(...conditions),
        with: {
          event: { columns: { title: true } },
        },
        orderBy: (o, { desc }) => [desc(o.createdAt)],
        limit: 100,
      });
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: and(eq(orders.id, input.id), eq(orders.organizationId, ctx.orgId)),
        with: {
          event: {
            columns: { title: true, slug: true, startDate: true },
            with: { venue: { columns: { name: true } } },
          },
          items: {
            with: { ticketType: { columns: { name: true } } },
          },
          tickets: {
            with: { ticketType: { columns: { name: true } } },
          },
          promoCode: { columns: { code: true, discountType: true, discountValue: true } },
        },
      });

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      return order;
    }),

  cancel: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: and(eq(orders.id, input.id), eq(orders.organizationId, ctx.orgId)),
        with: { items: true },
      });

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.status === "cancelled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order is already cancelled." });
      }

      // Cancel the order
      await ctx.db
        .update(orders)
        .set({ status: "cancelled" })
        .where(eq(orders.id, input.id));

      // Restore inventory
      for (const item of order.items) {
        await ctx.db
          .update(eventTicketTypes)
          .set({
            quantitySold: sql`GREATEST(${eventTicketTypes.quantitySold} - ${item.quantity}, 0)`,
          })
          .where(eq(eventTicketTypes.id, item.eventTicketTypeId));
      }

      // Cancel all tickets
      await ctx.db
        .update(tickets)
        .set({ status: "cancelled" })
        .where(eq(tickets.orderId, input.id));

      // Decrement promo code uses
      if (order.promoCodeId) {
        await ctx.db
          .update(promoCodes)
          .set({
            currentUses: sql`GREATEST(${promoCodes.currentUses} - 1, 0)`,
          })
          .where(eq(promoCodes.id, order.promoCodeId));
      }

      return { success: true };
    }),

  updateNotes: orgProcedure
    .input(z.object({ id: z.string().uuid(), notes: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: and(eq(orders.id, input.id), eq(orders.organizationId, ctx.orgId)),
        columns: { id: true },
      });

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const [updated] = await ctx.db
        .update(orders)
        .set({ notes: input.notes })
        .where(eq(orders.id, input.id))
        .returning();

      return updated;
    }),

  refund: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        refundAmount: z.number().int().positive(),
        refundReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: and(eq(orders.id, input.id), eq(orders.organizationId, ctx.orgId)),
        with: { items: true },
      });

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      if (order.status !== "confirmed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only confirmed orders can be refunded.",
        });
      }

      // Set order to refunded
      await ctx.db
        .update(orders)
        .set({
          status: "refunded",
          refundAmount: input.refundAmount,
          refundedAt: new Date(),
          refundReason: input.refundReason,
        })
        .where(eq(orders.id, input.id));

      // Cancel all tickets
      await ctx.db
        .update(tickets)
        .set({ status: "cancelled" })
        .where(eq(tickets.orderId, input.id));

      // Restore inventory
      for (const item of order.items) {
        await ctx.db
          .update(eventTicketTypes)
          .set({
            quantitySold: sql`GREATEST(${eventTicketTypes.quantitySold} - ${item.quantity}, 0)`,
          })
          .where(eq(eventTicketTypes.id, item.eventTicketTypeId));
      }

      // Decrement promo code uses
      if (order.promoCodeId) {
        await ctx.db
          .update(promoCodes)
          .set({
            currentUses: sql`GREATEST(${promoCodes.currentUses} - 1, 0)`,
          })
          .where(eq(promoCodes.id, order.promoCodeId));
      }

      // Auto-notify waitlist entries for freed ticket types
      const freedTicketTypeIds = [...new Set(order.items.map((i) => i.eventTicketTypeId))];

      for (const ticketTypeId of freedTicketTypeIds) {
        const waitingEntry = await ctx.db.query.waitlistEntries.findFirst({
          where: and(
            eq(waitlistEntries.eventId, order.eventId),
            eq(waitlistEntries.eventTicketTypeId, ticketTypeId),
            eq(waitlistEntries.status, "waiting")
          ),
          orderBy: (w, { asc }) => [asc(w.priority)],
        });

        if (waitingEntry) {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

          await ctx.db
            .update(waitlistEntries)
            .set({ status: "notified", notifiedAt: now, expiresAt })
            .where(eq(waitlistEntries.id, waitingEntry.id));
        }
      }

      return { success: true };
    }),

  createComp: orgProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        name: z.string().min(1),
        email: z.string().email(),
        items: z.array(
          z.object({
            ticketTypeId: z.string().uuid(),
            quantity: z.number().int().positive(),
          })
        ),
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

      // Create order
      const orderId = crypto.randomUUID();
      await ctx.db.insert(orders).values({
        id: orderId,
        organizationId: ctx.orgId,
        eventId: input.eventId,
        email: input.email,
        name: input.name,
        status: "confirmed",
        subtotalAmount: 0,
        feesAmount: 0,
        taxAmount: 0,
        gratuityAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        isComp: true,
        paymentMethod: "comp",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // not relevant for comp but required
      });

      // Create order items
      const insertedItems = [];
      for (const item of input.items) {
        const itemId = crypto.randomUUID();
        await ctx.db.insert(orderItems).values({
          id: itemId,
          orderId,
          eventTicketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice: 0,
          totalPrice: 0,
        });
        insertedItems.push({
          id: itemId,
          eventTicketTypeId: item.ticketTypeId,
          quantity: item.quantity,
        });

        // Update quantity sold
        await ctx.db
          .update(eventTicketTypes)
          .set({
            quantitySold: sql`${eventTicketTypes.quantitySold} + ${item.quantity}`,
          })
          .where(eq(eventTicketTypes.id, item.ticketTypeId));
      }

      // Generate tickets
      const generatedTickets = await generateTicketsForOrder(
        ctx.db,
        orderId,
        insertedItems,
        input.name,
        input.email,
        input.eventId
      );

      // Send confirmation email
      await sendOrderConfirmationEmail({
        to: input.email,
        orderName: input.name,
        orderId,
        eventTitle: event.title,
        eventDate: event.startDate,
        venueName: event.venue.name,
        tickets: generatedTickets.map((t) => ({
          ticketNumber: t.ticketNumber,
          ticketTypeName: "Comp",
        })),
      });

      return { orderId };
    }),
});
