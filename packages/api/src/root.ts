import { poolRouter } from "./router/pool";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  pool: poolRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
