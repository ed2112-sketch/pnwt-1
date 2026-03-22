import { z } from "zod";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicProcedure, orgProcedure } from "../init";
import { emailSubscribers, orders, tickets, waitlistEntries, events } from "@/server/db/schema";
import crypto from "crypto";

const UNSUBSCRIBE_SECRET = "pnwt-unsubscribe-secret";

function generateUnsubscribeToken(email: string): string {
  return crypto.createHash("sha256").update(email + UNSUBSCRIBE_SECRET).digest("hex").slice(0, 16);
}

export const emailSubscriberRouter = createRouter({
  list: orgProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(emailSubscribers.organizationId, ctx.orgId)];

      if (input?.search) {
        const pattern = `%${input.search}%`;
        conditions.push(
          or(
            ilike(emailSubscribers.email, pattern),
            ilike(emailSubscribers.name, pattern)
          )!
        );
      }

      return ctx.db.query.emailSubscribers.findMany({
        where: and(...conditions),
        orderBy: (s, { desc }) => [desc(s.createdAt)],
      });
    }),

  syncFromOrders: orgProcedure.mutation(async ({ ctx }) => {
    // Gather distinct emails from confirmed orders
    const orderEmails = await ctx.db
      .selectDistinct({ email: orders.email, name: orders.name })
      .from(orders)
      .where(
        and(
          eq(orders.organizationId, ctx.orgId),
          eq(orders.status, "confirmed")
        )
      );

    // Gather distinct emails from tickets via events
    const ticketEmails = await ctx.db
      .selectDistinct({ email: tickets.attendeeEmail, name: tickets.attendeeName })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(events.organizationId, ctx.orgId));

    // Gather distinct emails from waitlist entries
    const waitlistEmails = await ctx.db
      .selectDistinct({ email: waitlistEntries.email, name: waitlistEntries.name })
      .from(waitlistEntries)
      .where(eq(waitlistEntries.organizationId, ctx.orgId));

    // Dedupe by email
    const emailMap = new Map<string, string | null>();
    for (const row of [...orderEmails, ...ticketEmails, ...waitlistEmails]) {
      if (!emailMap.has(row.email)) {
        emailMap.set(row.email, row.name);
      }
    }

    let newCount = 0;

    for (const [email, name] of emailMap) {
      // Check if subscriber already exists for this org
      const existing = await ctx.db.query.emailSubscribers.findFirst({
        where: and(
          eq(emailSubscribers.organizationId, ctx.orgId),
          eq(emailSubscribers.email, email)
        ),
        columns: { id: true },
      });

      if (!existing) {
        await ctx.db.insert(emailSubscribers).values({
          organizationId: ctx.orgId,
          email,
          name,
          source: "order",
        });
        newCount++;
      }
    }

    return { newSubscribers: newCount };
  }),

  addManual: orgProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for existing subscriber
      const existing = await ctx.db.query.emailSubscribers.findFirst({
        where: and(
          eq(emailSubscribers.organizationId, ctx.orgId),
          eq(emailSubscribers.email, input.email)
        ),
        columns: { id: true },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Subscriber with this email already exists.",
        });
      }

      const [subscriber] = await ctx.db
        .insert(emailSubscribers)
        .values({
          organizationId: ctx.orgId,
          email: input.email,
          name: input.name,
          source: "manual",
        })
        .returning();

      return subscriber;
    }),

  remove: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const subscriber = await ctx.db.query.emailSubscribers.findFirst({
        where: and(
          eq(emailSubscribers.id, input.id),
          eq(emailSubscribers.organizationId, ctx.orgId)
        ),
        columns: { id: true },
      });

      if (!subscriber) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db
        .delete(emailSubscribers)
        .where(eq(emailSubscribers.id, input.id));

      return { success: true };
    }),

  unsubscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expectedToken = generateUnsubscribeToken(input.email);

      if (input.token !== expectedToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid unsubscribe token.",
        });
      }

      await ctx.db
        .update(emailSubscribers)
        .set({
          isSubscribed: false,
          unsubscribedAt: new Date(),
        })
        .where(eq(emailSubscribers.email, input.email));

      return { success: true };
    }),
});
