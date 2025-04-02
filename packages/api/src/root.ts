import { faucetRouter } from './router/faucet'
import { headlessRouter } from './router/headless'
import { NanoStateRouter } from './router/nanostates'
import { networkRouter } from './router/network'
import { poolRouter } from './router/pool'
import { presaleRouter } from './router/presale'
import { pricesRouter } from './router/prices'
import { profileRouter } from './router/profile'
import { tokenRouter } from './router/token'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  getPools: poolRouter,
  getTokens: tokenRouter,
  getProfile: profileRouter,
  getPrices: pricesRouter,
  getNanoState: NanoStateRouter,
  getHeadless: headlessRouter,
  getNetwork: networkRouter,
  getFaucet: faucetRouter,
  getPresale: presaleRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
