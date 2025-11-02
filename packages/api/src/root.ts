import { dozerToolsRouter } from './router/dozerTools'
import { faucetRouter } from './router/faucet'
import { headlessRouter } from './router/headless'
import { historyRouter } from './router/history'
import { NanoStateRouter } from './router/nanostates'
import { networkRouter } from './router/network'
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
  getNanoState: NanoStateRouter,
  getHeadless: headlessRouter,
  getNetwork: networkRouter,
  getFaucet: faucetRouter,
  getRewards: rewardsRouter,
  getOasis: oasisRouter,
  getStats: statsRouter,
  getDozerTools: dozerToolsRouter,
  getHistory: historyRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
