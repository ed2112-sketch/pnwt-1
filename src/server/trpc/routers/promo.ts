import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../init";
import { promoCodes } from "@/server/db/schema";

export const promoRouter = createRouter({
  list: orgProcedure
    .input(z.object({ eventId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const conditions = [eq(promoCodes.organizationId, ctx.orgId)];
      if (input?.eventId) conditions.push(eq(promoCodes.eventId, input.eventId));

      return ctx.db.query.promoCodes.findMany({
        where: and(...conditions),
        orderBy: (p, { desc }) => [desc(p.createdAt)],
      });
    }),

  create: orgProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50),
        description: z.string().optional(),
        discountType: z.enum(["percentage", "fixed_amount"]),
        discountValue: z.number().int().positive(),
        maxUses: z.number().int().positive().optional(),
        validFrom: z.coerce.date().optional(),
        validTo: z.coerce.date().optional(),
        eventId: z.string().uuid().optional(),
        minOrderAmount: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [promo] = await ctx.db
        .insert(promoCodes)
        .values({
          ...input,
          code: input.code.toUpperCase(),
          organizationId: ctx.orgId,
        })
        .returning();

      return promo;
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(1).max(50).optional(),
        description: z.string().optional().nullable(),
        discountType: z.enum(["percentage", "fixed_amount"]).optional(),
        discountValue: z.number().int().positive().optional(),
        maxUses: z.number().int().positive().optional().nullable(),
        validFrom: z.coerce.date().optional().nullable(),
        validTo: z.coerce.date().optional().nullable(),
        eventId: z.string().uuid().optional().nullable(),
        minOrderAmount: z.number().int().min(0).optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (data.code) data.code = data.code.toUpperCase();

      const [updated] = await ctx.db
        .update(promoCodes)
        .set(data)
        .where(and(eq(promoCodes.id, id), eq(promoCodes.organizationId, ctx.orgId)))
        .returning();

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(promoCodes)
        .where(and(eq(promoCodes.id, input.id), eq(promoCodes.organizationId, ctx.orgId)))
        .returning();

      if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
