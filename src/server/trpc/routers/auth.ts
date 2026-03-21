import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicProcedure, protectedProcedure } from "../init";
import { users, verificationTokens } from "@/server/db/schema";
import { sendVerificationEmail } from "@/server/email";

export const authRouter = createRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        password: z.string().min(8).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const [user] = await ctx.db
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          passwordHash,
        })
        .returning({ id: users.id, email: users.email });

      // Generate verification token
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await ctx.db.insert(verificationTokens).values({
        identifier: user.email,
        token,
        expires,
      });

      await sendVerificationEmail(user.email, token);

      return { success: true };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.query.verificationTokens.findFirst({
        where: eq(verificationTokens.token, input.token),
      });

      if (!record || record.expires < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification token.",
        });
      }

      await ctx.db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.email, record.identifier));

      await ctx.db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, input.token));

      return { success: true };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id!),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    return user ?? null;
  }),
});
