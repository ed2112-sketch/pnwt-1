import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, protectedProcedure } from "../init";
import { organizations, organizationMembers } from "@/server/db/schema";

export const onboardingRouter = createRouter({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const membership = await ctx.db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.userId, ctx.user.id!),
      with: { organization: true },
    });

    return {
      hasOrg: !!membership,
      orgSlug: membership?.organization.slug,
    };
  }),

  createOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z
          .string()
          .min(1)
          .max(50)
          .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [org] = await ctx.db
        .insert(organizations)
        .values({
          name: input.name,
          slug: input.slug,
        })
        .returning();

      await ctx.db.insert(organizationMembers).values({
        organizationId: org.id,
        userId: ctx.user.id!,
        role: "owner",
      });

      return { id: org.id, slug: org.slug };
    }),
});
