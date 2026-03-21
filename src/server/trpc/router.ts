import { createRouter, createCallerFactory } from "./init";
import { healthRouter } from "./routers/health";
import { authRouter } from "./routers/auth";

export const appRouter = createRouter({
  health: healthRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
