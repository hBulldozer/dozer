import { faucetRouter } from './router/faucet'
import { headlessRouter } from './router/headless'
import { NanoStateRouter } from './router/nanostates'
import { networkRouter } from './router/network'
import { newPricesRouter } from './router/newPrices'
import { oasisRouter } from './router/oasis'
import { poolRouter } from './router/pool'
import { pricesRouter } from './router/prices'
import { profileRouter } from './router/profile'
import { rewardsRouter } from './router/rewards'
import { statsRouter } from './router/stats'
import { tokenRouter } from './router/token'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  getPools: poolRouter,
  getTokens: tokenRouter,
  getProfile: profileRouter,
  getPrices: pricesRouter,
  getNewPrices: newPricesRouter,
  getNanoState: NanoStateRouter,
  getHeadless: headlessRouter,
  getNetwork: networkRouter,
  getFaucet: faucetRouter,
  getRewards: rewardsRouter,
  getOasis: oasisRouter,
  getStats: statsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
