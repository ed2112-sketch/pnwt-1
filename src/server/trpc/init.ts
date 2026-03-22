import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { Session } from "next-auth";

export type TRPCContext = {
  db: typeof db;
  session: Session | null;
};

export async function createTRPCContext(): Promise<TRPCContext> {
  const session = await auth();
  return { db, session };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const { orgId, orgRole } = ctx.user as { orgId?: string; orgRole?: string };

  if (!orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No organization membership found.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      orgId,
      orgRole: orgRole as string,
    },
  });
});
