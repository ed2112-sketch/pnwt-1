import "server-only";
import { cache } from "react";
import { createCaller } from "@/server/trpc/router";
import { createTRPCContext } from "@/server/trpc/init";

export const serverTRPC = cache(async () => {
  const context = await createTRPCContext();
  return createCaller(context);
});
