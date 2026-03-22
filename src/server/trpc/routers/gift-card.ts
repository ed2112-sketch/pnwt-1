import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure, publicProcedure } from "../init";
import { giftCards, giftCardTransactions } from "@/server/db/schema";

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GC-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Map schema fields to UI-friendly names */
function mapCard<T extends { initialAmount: number; balance: number }>(card: T) {
  return {
    ...card,
    initialBalance: card.initialAmount,
    currentBalance: card.balance,
  };
}

export const giftCardRouter = createRouter({
  create: orgProcedure
    .input(
      z.object({
        initialBalance: z.number().int().positive(),
        recipientEmail: z.string().email(),
        recipientName: z.string().min(1),
        message: z.string().optional(),
        expiresAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const code = generateGiftCardCode();

      const [card] = await ctx.db
        .insert(giftCards)
        .values({
          organizationId: ctx.orgId,
          code,
          initialAmount: input.initialBalance,
          balance: input.initialBalance,
          status: "active",
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          message: input.message,
          expiresAt: input.expiresAt,
        })
        .returning();

      return mapCard(card);
    }),

  list: orgProcedure.query(async ({ ctx }) => {
    const cards = await ctx.db.query.giftCards.findMany({
      where: eq(giftCards.organizationId, ctx.orgId),
      orderBy: [desc(giftCards.createdAt)],
    });
    return cards.map(mapCard);
  }),

  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const card = await ctx.db.query.giftCards.findFirst({
        where: and(
          eq(giftCards.id, input.id),
          eq(giftCards.organizationId, ctx.orgId)
        ),
        with: { transactions: true },
      });

      if (!card) throw new TRPCError({ code: "NOT_FOUND" });
      return mapCard(card);
    }),

  checkBalance: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const card = await ctx.db.query.giftCards.findFirst({
        where: eq(giftCards.code, input.code.toUpperCase()),
      });

      if (!card) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gift card not found.",
        });
      }

      return {
        balance: card.balance,
        status: card.status,
      };
    }),

  cancel: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(giftCards)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(giftCards.id, input.id),
            eq(giftCards.organizationId, ctx.orgId)
          )
        )
        .returning();

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return mapCard(updated);
    }),
});
