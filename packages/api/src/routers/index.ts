import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { shoppingRouter } from "../shopping";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  shopping: shoppingRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
