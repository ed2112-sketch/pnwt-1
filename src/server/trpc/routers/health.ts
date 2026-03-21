import { createRouter, publicProcedure } from "../init";

export const healthRouter = createRouter({
  check: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date() };
  }),
});
