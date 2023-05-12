import { poolRouter } from './router/pool'
import { tokenRouter } from './router/token'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  getPools: poolRouter,
  getTokens: tokenRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
