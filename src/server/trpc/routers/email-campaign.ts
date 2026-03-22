import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../init";
import { emailCampaigns, emailSubscribers, orders, tickets, events } from "@/server/db/schema";
import type { SegmentFilter } from "@/server/db/schema/email";
import { Resend } from "resend";
import crypto from "crypto";

const UNSUBSCRIBE_SECRET = "pnwt-unsubscribe-secret";

function generateUnsubscribeToken(email: string): string {
  return crypto.createHash("sha256").update(email + UNSUBSCRIBE_SECRET).digest("hex").slice(0, 16);
}

let resendInstance: Resend | null = null;
function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const segmentFilterSchema = z.object({
  type: z.enum(["all", "event", "vip", "recent"]),
  eventId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
  minSpent: z.number().optional(),
});

async function getSubscribersForSegment(
  db: any,
  orgId: string,
  filter: SegmentFilter
): Promise<Array<{ id: string; email: string; name: string | null }>> {
  const baseConditions = and(
    eq(emailSubscribers.organizationId, orgId),
    eq(emailSubscribers.isSubscribed, true)
  );

  if (filter.type === "all") {
    return db.query.emailSubscribers.findMany({
      where: baseConditions,
      columns: { id: true, email: true, name: true },
    });
  }

  if (filter.type === "event" && filter.eventId) {
    // Get emails from orders/tickets for this event
    const orderEmails = await db
      .selectDistinct({ email: orders.email })
      .from(orders)
      .where(
        and(
          eq(orders.organizationId, orgId),
          eq(orders.eventId, filter.eventId),
          eq(orders.status, "confirmed")
        )
      );

    const ticketEmails = await db
      .selectDistinct({ email: tickets.attendeeEmail })
      .from(tickets)
      .where(eq(tickets.eventId, filter.eventId));

    const eventEmailSet = new Set([
      ...orderEmails.map((r: any) => r.email),
      ...ticketEmails.map((r: any) => r.email),
    ]);

    const allSubscribed = await db.query.emailSubscribers.findMany({
      where: baseConditions,
      columns: { id: true, email: true, name: true },
    });

    return allSubscribed.filter((s: any) => eventEmailSet.has(s.email));
  }

  if (filter.type === "vip") {
    // Subscribers whose email appears in orders with totalAmount sum >= 50000
    const vipRows = await db
      .select({
        email: orders.email,
        total: sql<number>`sum(${orders.totalAmount})`.as("total"),
      })
      .from(orders)
      .where(
        and(eq(orders.organizationId, orgId), eq(orders.status, "confirmed"))
      )
      .groupBy(orders.email)
      .having(sql`sum(${orders.totalAmount}) >= 50000`);

    const vipEmails = new Set(vipRows.map((r: any) => r.email));

    const allSubscribed = await db.query.emailSubscribers.findMany({
      where: baseConditions,
      columns: { id: true, email: true, name: true },
    });

    return allSubscribed.filter((s: any) => vipEmails.has(s.email));
  }

  if (filter.type === "recent") {
    // Subscribers whose email appears in orders from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentRows = await db
      .selectDistinct({ email: orders.email })
      .from(orders)
      .where(
        and(
          eq(orders.organizationId, orgId),
          eq(orders.status, "confirmed"),
          sql`${orders.createdAt} >= ${ninetyDaysAgo}`
        )
      );

    const recentEmails = new Set(recentRows.map((r: any) => r.email));

    const allSubscribed = await db.query.emailSubscribers.findMany({
      where: baseConditions,
      columns: { id: true, email: true, name: true },
    });

    return allSubscribed.filter((s: any) => recentEmails.has(s.email));
  }

  // Fallback: all subscribed
  return db.query.emailSubscribers.findMany({
    where: baseConditions,
    columns: { id: true, email: true, name: true },
  });
}

function wrapInLayout(htmlContent: string, unsubscribeUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #2563eb;">
    <h1 style="color: #2563eb; margin: 0; font-size: 24px;">PNWTickets</h1>
  </div>
  <div style="padding: 20px 0;">
    ${htmlContent}
  </div>
  <div style="border-top: 1px solid #e5e7eb; padding: 20px 0; text-align: center; color: #6b7280; font-size: 12px;">
    <p>You're receiving this because you subscribed to updates from PNWTickets.</p>
    <p><a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a></p>
  </div>
</body>
</html>`;
}

export const emailCampaignRouter = createRouter({
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.query.emailCampaigns.findMany({
      where: eq(emailCampaigns.organizationId, ctx.orgId),
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    });
  }),

  create: orgProcedure
    .input(
      z.object({
        title: z.string().min(1),
        subject: z.string().min(1),
        previewText: z.string().optional(),
        htmlContent: z.string().min(1),
        segmentFilter: segmentFilterSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [campaign] = await ctx.db
        .insert(emailCampaigns)
        .values({
          organizationId: ctx.orgId,
          title: input.title,
          subject: input.subject,
          previewText: input.previewText,
          htmlContent: input.htmlContent,
          segmentFilter: input.segmentFilter ?? { type: "all" as const },
          status: "draft",
        })
        .returning();

      return campaign;
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.query.emailCampaigns.findFirst({
        where: and(
          eq(emailCampaigns.id, input.id),
          eq(emailCampaigns.organizationId, ctx.orgId)
        ),
      });

      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      return campaign;
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        subject: z.string().min(1).optional(),
        previewText: z.string().optional(),
        htmlContent: z.string().min(1).optional(),
        segmentFilter: segmentFilterSchema.optional(),
        status: z.enum(["draft", "scheduled"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.query.emailCampaigns.findFirst({
        where: and(
          eq(emailCampaigns.id, input.id),
          eq(emailCampaigns.organizationId, ctx.orgId)
        ),
        columns: { id: true, status: true },
      });

      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      if (campaign.status !== "draft" && campaign.status !== "scheduled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only update draft or scheduled campaigns.",
        });
      }

      const { id, ...updates } = input;

      const [updated] = await ctx.db
        .update(emailCampaigns)
        .set(updates)
        .where(eq(emailCampaigns.id, id))
        .returning();

      return updated;
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.query.emailCampaigns.findFirst({
        where: and(
          eq(emailCampaigns.id, input.id),
          eq(emailCampaigns.organizationId, ctx.orgId)
        ),
        columns: { id: true, status: true },
      });

      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      if (campaign.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only delete draft campaigns.",
        });
      }

      await ctx.db
        .delete(emailCampaigns)
        .where(eq(emailCampaigns.id, input.id));

      return { success: true };
    }),

  getRecipients: orgProcedure
    .input(z.object({ segmentFilter: segmentFilterSchema }))
    .query(async ({ ctx, input }) => {
      const recipients = await getSubscribersForSegment(
        ctx.db,
        ctx.orgId,
        input.segmentFilter
      );

      return {
        count: recipients.length,
        preview: recipients.slice(0, 10).map((r) => r.email),
      };
    }),

  send: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.query.emailCampaigns.findFirst({
        where: and(
          eq(emailCampaigns.id, input.id),
          eq(emailCampaigns.organizationId, ctx.orgId)
        ),
      });

      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      if (campaign.status !== "draft" && campaign.status !== "scheduled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Campaign must be in draft or scheduled status to send.",
        });
      }

      // Get recipients
      const filter = (campaign.segmentFilter as SegmentFilter) ?? { type: "all" as const };
      const recipients = await getSubscribersForSegment(
        ctx.db,
        ctx.orgId,
        filter
      );

      if (recipients.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No recipients found for this campaign's segment.",
        });
      }

      // Set status to sending
      await ctx.db
        .update(emailCampaigns)
        .set({ status: "sending", recipientCount: recipients.length })
        .where(eq(emailCampaigns.id, input.id));

      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      const resend = getResend();
      let sentCount = 0;

      // Send in batches of 10
      for (let i = 0; i < recipients.length; i += 10) {
        const batch = recipients.slice(i, i + 10);

        const sendPromises = batch.map(async (subscriber) => {
          const token = generateUnsubscribeToken(subscriber.email);
          const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${token}`;
          const html = wrapInLayout(campaign.htmlContent, unsubscribeUrl);

          try {
            await resend.emails.send({
              from: "PNWTickets <noreply@pnwtickets.com>",
              to: subscriber.email,
              subject: campaign.subject,
              html,
            });
            sentCount++;
          } catch {
            // Log failure but continue sending to others
            console.error(`Failed to send campaign email to ${subscriber.email}`);
          }
        });

        await Promise.all(sendPromises);
      }

      // Update campaign status
      await ctx.db
        .update(emailCampaigns)
        .set({
          status: "sent",
          sentCount,
          sentAt: new Date(),
        })
        .where(eq(emailCampaigns.id, input.id));

      return { sentCount, recipientCount: recipients.length };
    }),

  schedule: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        scheduledAt: z.coerce.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.query.emailCampaigns.findFirst({
        where: and(
          eq(emailCampaigns.id, input.id),
          eq(emailCampaigns.organizationId, ctx.orgId)
        ),
        columns: { id: true, status: true },
      });

      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      if (campaign.status !== "draft" && campaign.status !== "scheduled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only schedule draft or scheduled campaigns.",
        });
      }

      const [updated] = await ctx.db
        .update(emailCampaigns)
        .set({ status: "scheduled", scheduledAt: input.scheduledAt })
        .where(eq(emailCampaigns.id, input.id))
        .returning();

      return updated;
    }),
});
