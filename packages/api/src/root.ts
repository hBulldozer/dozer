import { poolRouter } from './router/pool'
import { profileRouter } from './router/profile'
import { tokenRouter } from './router/token'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  getPools: poolRouter,
  getTokens: tokenRouter,
  getProfile: profileRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
