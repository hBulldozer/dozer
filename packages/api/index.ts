import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server'

import { type AppRouter } from './src/root'
import { generateSSGHelper } from './src/helpers/ssgHelper'

export { appRouter, type AppRouter } from './src/root'
export { createTRPCContext } from './src/trpc'

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

export * from './src/types'
export * from './src/functions'
export * from './src/hooks'
export type { client } from './src/client'
export * from './utils/uploadthing'
