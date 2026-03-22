import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../init";
import { venues } from "@/server/db/schema";

export const venueRouter = createRouter({
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.query.venues.findMany({
      where: eq(venues.organizationId, ctx.orgId),
      orderBy: (v, { asc }) => [asc(v.name)],
    });
  }),

  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const venue = await ctx.db.query.venues.findFirst({
        where: and(
          eq(venues.id, input.id),
          eq(venues.organizationId, ctx.orgId)
        ),
        with: { events: { limit: 10, orderBy: (e, { desc }) => [desc(e.startDate)] } },
      });

      if (!venue) throw new TRPCError({ code: "NOT_FOUND" });
      return venue;
    }),

  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        slug: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-z0-9-]+$/),
        type: z.enum(["theater", "restaurant", "bar", "club", "outdoor", "other"]).default("other"),
        description: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        websiteUrl: z.string().url().optional(),
        imageUrl: z.string().url().optional(),
        capacity: z.number().int().positive().optional(),
        settings: z
          .object({
            hasDinnerService: z.boolean().optional(),
            autoGratuityPercent: z.number().optional(),
            taxRate: z.number().optional(),
            serviceChargePercent: z.number().optional(),
            crossPromoEnabled: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [venue] = await ctx.db
        .insert(venues)
        .values({ ...input, organizationId: ctx.orgId })
        .returning();

      return venue;
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
        type: z.enum(["theater", "restaurant", "bar", "club", "outdoor", "other"]).optional(),
        description: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        zip: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        websiteUrl: z.string().url().optional().nullable(),
        imageUrl: z.string().url().optional().nullable(),
        capacity: z.number().int().positive().optional().nullable(),
        isActive: z.boolean().optional(),
        settings: z
          .object({
            hasDinnerService: z.boolean().optional(),
            autoGratuityPercent: z.number().optional(),
            taxRate: z.number().optional(),
            serviceChargePercent: z.number().optional(),
            crossPromoEnabled: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(venues)
        .set(data)
        .where(and(eq(venues.id, id), eq(venues.organizationId, ctx.orgId)))
        .returning();

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(venues)
        .where(and(eq(venues.id, input.id), eq(venues.organizationId, ctx.orgId)))
        .returning();

      if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
