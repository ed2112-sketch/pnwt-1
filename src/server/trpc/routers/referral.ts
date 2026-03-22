import { z } from "zod";
import { eq, and, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedProcedure, orgProcedure } from "../init";
import {
  referralCodes,
  referralConversions,
  users,
  organizationMembers,
} from "@/server/db/schema";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "REF-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const referralRouter = createRouter({
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id as string;

    // Try to find existing referral code for this user
    const existing = await ctx.db.query.referralCodes.findFirst({
      where: eq(referralCodes.userId, userId),
    });

    if (existing) {
      const [stats] = await ctx.db
        .select({
          conversions: sql<number>`COUNT(*)`,
          totalCredits: sql<number>`COALESCE(SUM(${referralConversions.creditedAmount}), 0)`,
        })
        .from(referralConversions)
        .where(eq(referralConversions.referralCodeId, existing.id));

      return {
        code: existing.code,
        conversions: Number(stats.conversions),
        totalCredits: Number(stats.totalCredits),
      };
    }

    // Get org from membership
    const membership = await ctx.db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.userId, userId),
    });

    if (!membership) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No organization membership found.",
      });
    }

    const code = generateReferralCode();

    const [created] = await ctx.db
      .insert(referralCodes)
      .values({
        organizationId: membership.organizationId,
        userId,
        code,
        creditAmount: 500, // $5 default
      })
      .returning();

    return {
      code: created.code,
      conversions: 0,
      totalCredits: 0,
    };
  }),

  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id as string;

    const referral = await ctx.db.query.referralCodes.findFirst({
      where: eq(referralCodes.userId, userId),
    });

    if (!referral) {
      return { conversions: 0, totalCredits: 0 };
    }

    const [stats] = await ctx.db
      .select({
        conversions: sql<number>`COUNT(*)`,
        totalCredits: sql<number>`COALESCE(SUM(${referralConversions.creditedAmount}), 0)`,
      })
      .from(referralConversions)
      .where(eq(referralConversions.referralCodeId, referral.id));

    return {
      conversions: Number(stats.conversions),
      totalCredits: Number(stats.totalCredits),
    };
  }),

  list: orgProcedure.query(async ({ ctx }) => {
    const codes = await ctx.db
      .select({
        id: referralCodes.id,
        code: referralCodes.code,
        creditAmount: referralCodes.creditAmount,
        maxUses: referralCodes.maxUses,
        currentUses: referralCodes.currentUses,
        isActive: referralCodes.isActive,
        createdAt: referralCodes.createdAt,
        userName: users.name,
        userEmail: users.email,
        conversions: sql<number>`COUNT(${referralConversions.id})`,
        creditsEarned: sql<number>`COALESCE(SUM(${referralConversions.creditedAmount}), 0)`,
      })
      .from(referralCodes)
      .innerJoin(users, eq(referralCodes.userId, users.id))
      .leftJoin(
        referralConversions,
        eq(referralConversions.referralCodeId, referralCodes.id)
      )
      .where(eq(referralCodes.organizationId, ctx.orgId))
      .groupBy(
        referralCodes.id,
        referralCodes.code,
        referralCodes.creditAmount,
        referralCodes.maxUses,
        referralCodes.currentUses,
        referralCodes.isActive,
        referralCodes.createdAt,
        users.name,
        users.email
      )
      .orderBy(desc(referralCodes.createdAt));

    return codes.map((row) => ({
      ...row,
      conversions: Number(row.conversions),
      creditsEarned: Number(row.creditsEarned),
    }));
  }),
});
