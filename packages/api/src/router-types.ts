import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server'
import { type AppRouter } from './root'

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 *
 * These types are kept in a separate file to isolate the @trpc/server import.
 * The @trpc/server package should not be bundled in client-side code.
 **/
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>
