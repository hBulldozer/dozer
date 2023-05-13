import { poolRouter } from './router/pool'
import { priceRouter } from './router/prices'
import { tokenRouter } from './router/token'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  getPools: poolRouter,
  getTokens: tokenRouter,
  getPrices: priceRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
