import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicProcedure } from "../init";
import {
  events,
  eventTicketTypes,
  venues,
  pricingTiers,
  promoCodes,
  orders,
  orderItems,
  giftCards,
  giftCardTransactions,
  referralCodes,
  referralConversions,
  users,
} from "@/server/db/schema";
import { generateTicketsForOrder } from "@/lib/tickets";
import { sendOrderConfirmationEmail } from "@/server/email";
import {
  computeCurrentPrice,
  calculateOrderTotal,
  type VenueSettingsForPricing,
  type EventSettingsForPricing,
} from "@/lib/pricing";

export const checkoutRouter = createRouter({
  getEventForCheckout: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: and(eq(events.slug, input.slug), eq(events.status, "published")),
        with: {
          venue: true,
          ticketTypes: {
            where: eq(eventTicketTypes.isActive, true),
            orderBy: (tt, { asc }) => [asc(tt.sortOrder)],
            with: { pricingTiers: true },
          },
        },
      });

      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      const now = new Date();
      const ticketTypesWithPricing = event.ticketTypes
        .filter((tt) => {
          if (tt.saleStart && now < tt.saleStart) return false;
          if (tt.saleEnd && now > tt.saleEnd) return false;
          return true;
        })
        .map((tt) => {
          const priceResult = computeCurrentPrice(tt, tt.pricingTiers, now);
          const remaining = tt.quantity - tt.quantitySold;
          return {
            id: tt.id,
            name: tt.name,
            description: tt.description,
            basePrice: tt.price,
            currentPrice: priceResult.price,
            tierName: priceResult.tierName,
            tierId: priceResult.tierId,
            remaining,
            maxPerOrder: tt.settings?.maxPerOrder ?? 10,
          };
        });

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        shortDescription: event.shortDescription,
        eventType: event.eventType,
        startDate: event.startDate,
        endDate: event.endDate,
        doorsOpen: event.doorsOpen,
        imageUrl: event.imageUrl,
        settings: event.settings,
        venue: {
          name: event.venue.name,
          address: event.venue.address,
          city: event.venue.city,
          state: event.venue.state,
          settings: event.venue.settings,
        },
        ticketTypes: ticketTypesWithPricing,
      };
    }),

  calculatePrice: publicProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        items: z.array(
          z.object({
            ticketTypeId: z.string().uuid(),
            quantity: z.number().int().positive(),
          })
        ),
        promoCode: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        with: {
          venue: true,
          ticketTypes: {
            with: { pricingTiers: true },
          },
        },
      });

      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      const now = new Date();
      let subtotal = 0;
      const itemDetails = input.items.map((item) => {
        const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
        if (!tt) throw new TRPCError({ code: "BAD_REQUEST", message: `Ticket type not found` });

        const priceResult = computeCurrentPrice(tt, tt.pricingTiers, now);
        const lineTotal = priceResult.price * item.quantity;
        subtotal += lineTotal;

        return {
          ticketTypeId: tt.id,
          name: tt.name,
          quantity: item.quantity,
          unitPrice: priceResult.price,
          lineTotal,
          tierName: priceResult.tierName,
        };
      });

      let promoCodeData = null;
      if (input.promoCode) {
        const promo = await ctx.db.query.promoCodes.findFirst({
          where: and(
            eq(promoCodes.code, input.promoCode.toUpperCase()),
            eq(promoCodes.organizationId, event.organizationId),
            eq(promoCodes.isActive, true)
          ),
        });

        if (promo) {
          const now = new Date();
          const valid =
            (!promo.validFrom || now >= promo.validFrom) &&
            (!promo.validTo || now <= promo.validTo) &&
            (!promo.maxUses || promo.currentUses < promo.maxUses) &&
            (!promo.eventId || promo.eventId === event.id) &&
            (!promo.minOrderAmount || subtotal >= promo.minOrderAmount);

          if (valid) promoCodeData = promo;
        }
      }

      const venueSettings: VenueSettingsForPricing = event.venue.settings ?? {};
      const eventSettings: EventSettingsForPricing = event.settings ?? {};

      const totals = calculateOrderTotal(
        subtotal,
        venueSettings,
        eventSettings,
        promoCodeData
      );

      return { items: itemDetails, ...totals };
    }),

  applyPromoCode: publicProcedure
    .input(z.object({ code: z.string(), eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        columns: { id: true, organizationId: true },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      const promo = await ctx.db.query.promoCodes.findFirst({
        where: and(
          eq(promoCodes.code, input.code.toUpperCase()),
          eq(promoCodes.organizationId, event.organizationId),
          eq(promoCodes.isActive, true)
        ),
      });

      if (!promo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid promo code." });
      }

      const now = new Date();
      if (promo.validFrom && now < promo.validFrom) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This promo code is not yet active." });
      }
      if (promo.validTo && now > promo.validTo) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This promo code has expired." });
      }
      if (promo.maxUses && promo.currentUses >= promo.maxUses) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This promo code has been fully redeemed." });
      }
      if (promo.eventId && promo.eventId !== input.eventId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This promo code is not valid for this event." });
      }

      return {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        description: promo.description,
      };
    }),

  createOrder: publicProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        items: z.array(
          z.object({
            ticketTypeId: z.string().uuid(),
            quantity: z.number().int().positive(),
          })
        ),
        email: z.string().email(),
        name: z.string().min(1),
        promoCode: z.string().optional(),
        giftCardCode: z.string().optional(),
        referralCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: and(eq(events.id, input.eventId), eq(events.status, "published")),
        with: {
          venue: true,
          ticketTypes: {
            with: { pricingTiers: true },
          },
        },
      });

      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });

      const now = new Date();

      // Validate inventory
      for (const item of input.items) {
        const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
        if (!tt) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid ticket type." });

        const remaining = tt.quantity - tt.quantitySold;
        if (item.quantity > remaining) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Only ${remaining} "${tt.name}" tickets remaining.`,
          });
        }
      }

      // Compute prices
      let subtotal = 0;
      const orderItemsData = input.items.map((item) => {
        const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId)!;
        const priceResult = computeCurrentPrice(tt, tt.pricingTiers, now);
        const lineTotal = priceResult.price * item.quantity;
        subtotal += lineTotal;

        return {
          eventTicketTypeId: tt.id,
          quantity: item.quantity,
          unitPrice: priceResult.price,
          totalPrice: lineTotal,
          pricingTierId: priceResult.tierId,
        };
      });

      // Validate promo code
      let promoCodeRecord = null;
      if (input.promoCode) {
        promoCodeRecord = await ctx.db.query.promoCodes.findFirst({
          where: and(
            eq(promoCodes.code, input.promoCode.toUpperCase()),
            eq(promoCodes.organizationId, event.organizationId),
            eq(promoCodes.isActive, true)
          ),
        });

        if (promoCodeRecord) {
          const valid =
            (!promoCodeRecord.validFrom || now >= promoCodeRecord.validFrom) &&
            (!promoCodeRecord.validTo || now <= promoCodeRecord.validTo) &&
            (!promoCodeRecord.maxUses || promoCodeRecord.currentUses < promoCodeRecord.maxUses) &&
            (!promoCodeRecord.eventId || promoCodeRecord.eventId === event.id) &&
            (!promoCodeRecord.minOrderAmount || subtotal >= promoCodeRecord.minOrderAmount);

          if (!valid) promoCodeRecord = null;
        }
      }

      const venueSettings: VenueSettingsForPricing = event.venue.settings ?? {};
      const eventSettings: EventSettingsForPricing = event.settings ?? {};
      const totals = calculateOrderTotal(subtotal, venueSettings, eventSettings, promoCodeRecord);

      // Gift card validation
      let giftCardRecord: typeof giftCards.$inferSelect | null = null;
      let giftCardAmountUsed = 0;

      if (input.giftCardCode) {
        const card = await ctx.db.query.giftCards.findFirst({
          where: and(
            eq(giftCards.code, input.giftCardCode.toUpperCase()),
            eq(giftCards.status, "active")
          ),
        });

        if (!card) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid gift card." });
        }

        if (card.balance <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Gift card has no remaining balance." });
        }

        giftCardRecord = card;
        giftCardAmountUsed = Math.min(card.balance, totals.total);
        totals.total -= giftCardAmountUsed;
      }

      // Create order + items and update inventory
      const [order] = await ctx.db
        .insert(orders)
        .values({
          organizationId: event.organizationId,
          eventId: event.id,
          email: input.email,
          name: input.name,
          status: "confirmed", // Stub payment — auto-confirm
          subtotalAmount: totals.subtotal,
          feesAmount: totals.serviceCharge,
          taxAmount: totals.tax,
          gratuityAmount: totals.gratuity,
          discountAmount: totals.discount,
          totalAmount: totals.total,
          promoCodeId: promoCodeRecord?.id,
          giftCardId: giftCardRecord?.id,
          giftCardAmountUsed,
          paymentMethod: "stub",
          expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
        })
        .returning();

      // Insert order items
      const insertedItems = await ctx.db
        .insert(orderItems)
        .values(
          orderItemsData.map((item) => ({
            ...item,
            orderId: order.id,
          }))
        )
        .returning();

      // Update inventory
      for (const item of input.items) {
        await ctx.db
          .update(eventTicketTypes)
          .set({
            quantitySold: sql`${eventTicketTypes.quantitySold} + ${item.quantity}`,
          })
          .where(eq(eventTicketTypes.id, item.ticketTypeId));
      }

      // Increment promo code uses
      if (promoCodeRecord) {
        await ctx.db
          .update(promoCodes)
          .set({
            currentUses: sql`${promoCodes.currentUses} + 1`,
          })
          .where(eq(promoCodes.id, promoCodeRecord.id));
      }

      // Deduct gift card balance and record transaction
      if (giftCardRecord && giftCardAmountUsed > 0) {
        const newBalance = giftCardRecord.balance - giftCardAmountUsed;

        await ctx.db
          .update(giftCards)
          .set({
            balance: newBalance,
            status: newBalance === 0 ? "depleted" : "active",
          })
          .where(eq(giftCards.id, giftCardRecord.id));

        await ctx.db.insert(giftCardTransactions).values({
          giftCardId: giftCardRecord.id,
          orderId: order.id,
          amount: -giftCardAmountUsed,
          balanceAfter: newBalance,
          description: `Redeemed for order ${order.id}`,
        });
      }

      // Record referral conversion
      if (input.referralCode) {
        const referral = await ctx.db.query.referralCodes.findFirst({
          where: and(
            eq(referralCodes.code, input.referralCode.toUpperCase()),
            eq(referralCodes.isActive, true)
          ),
        });

        if (referral) {
          await ctx.db.insert(referralConversions).values({
            referralCodeId: referral.id,
            orderId: order.id,
            referrerCredited: true,
            creditedAmount: referral.creditAmount,
          });

          await ctx.db
            .update(referralCodes)
            .set({
              currentUses: sql`${referralCodes.currentUses} + 1`,
            })
            .where(eq(referralCodes.id, referral.id));
        }
      }

      // Update user CLV
      if (ctx.session?.user?.id) {
        await ctx.db
          .update(users)
          .set({
            totalSpent: sql`${users.totalSpent} + ${order.totalAmount}`,
            totalOrders: sql`${users.totalOrders} + 1`,
            lastOrderAt: now,
          })
          .where(eq(users.id, ctx.session.user.id as string));
      }

      // Generate individual tickets
      const createdTickets = await generateTicketsForOrder(
        ctx.db,
        order.id,
        insertedItems,
        input.name,
        input.email,
        event.id
      );

      // Send confirmation email (fire-and-forget)
      sendOrderConfirmationEmail({
        to: input.email,
        orderName: input.name,
        orderId: order.id,
        eventTitle: event.title,
        eventDate: event.startDate,
        venueName: event.venue.name,
        tickets: createdTickets.map((t) => ({
          ticketNumber: t.ticketNumber,
          ticketTypeName:
            event.ticketTypes.find((tt) => tt.id === t.eventTicketTypeId)
              ?.name ?? "Ticket",
        })),
      }).catch(console.error);

      return { orderId: order.id };
    }),

  getOrder: publicProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: {
          event: {
            columns: { title: true, slug: true, startDate: true, endDate: true },
            with: { venue: { columns: { name: true } } },
          },
          items: {
            with: {
              ticketType: { columns: { name: true } },
            },
          },
        },
      });

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      return order;
    }),
});
