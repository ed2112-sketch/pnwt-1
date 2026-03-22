import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, orgProcedure } from "../init";
import {
  organizations,
  organizationMembers,
  users,
  venues,
  events,
} from "@/server/db/schema";

export const organizationRouter = createRouter({
  get: orgProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.query.organizations.findFirst({
      where: eq(organizations.id, ctx.orgId),
      with: {
        members: { with: { user: true } },
        venues: true,
      },
    });
    return org;
  }),

  update: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        slug: z
          .string()
          .min(1)
          .max(50)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        logoUrl: z.string().url().optional().nullable(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.orgRole !== "owner" && ctx.orgRole !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owners and admins can update organization settings." });
      }

      const [updated] = await ctx.db
        .update(organizations)
        .set(input)
        .where(eq(organizations.id, ctx.orgId))
        .returning();

      return updated;
    }),

  getMembers: orgProcedure.query(async ({ ctx }) => {
    const members = await ctx.db.query.organizationMembers.findMany({
      where: eq(organizationMembers.organizationId, ctx.orgId),
      with: {
        user: {
          columns: { id: true, name: true, email: true, image: true },
        },
      },
    });
    return members;
  }),

  updateMemberRole: orgProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        role: z.enum(["admin", "manager", "member", "promoter"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.orgRole !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owners can change member roles." });
      }

      const [updated] = await ctx.db
        .update(organizationMembers)
        .set({ role: input.role })
        .where(
          and(
            eq(organizationMembers.id, input.memberId),
            eq(organizationMembers.organizationId, ctx.orgId)
          )
        )
        .returning();

      return updated;
    }),

  removeMember: orgProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.orgRole !== "owner" && ctx.orgRole !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const member = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.id, input.memberId),
          eq(organizationMembers.organizationId, ctx.orgId)
        ),
      });

      if (!member) throw new TRPCError({ code: "NOT_FOUND" });
      if (member.role === "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot remove the owner." });
      }

      await ctx.db
        .delete(organizationMembers)
        .where(eq(organizationMembers.id, input.memberId));

      return { success: true };
    }),
});
