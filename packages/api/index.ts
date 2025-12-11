import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server'

import { type AppRouter } from './src/root'

export { type AppRouter, appRouter } from './src/root'
export { createTRPCContext, responseMeta } from './src/trpc'

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>

export type { client } from './src/client'
export * from './src/functions'
export * from './src/hooks'
export * from './src/types'
export { type TransactionHistory } from './src/router/pool'
export { type UserProfitInfo } from './src/utils/namedTupleParsers'
