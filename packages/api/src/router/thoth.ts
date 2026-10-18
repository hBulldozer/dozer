import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { resolvePrimaryName, resolvePrimaryNames } from '../helpers/thoth'
import { createTRPCRouter, procedure } from '../trpc'

const LOOKUP_TIMEOUT_MS = 2500

// Bounds the wait so a cold lookup does not stall other queries in the same httpBatchLink request.
// The underlying promise keeps running and still populates the cache inside resolvePrimaryNames.
async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => {}) // avoid unhandled rejection if we time out first
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new TRPCError({ code: 'TIMEOUT', message: 'thoth lookup warming up' })),
      LOOKUP_TIMEOUT_MS,
    )
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export const thothRouter = createTRPCRouter({
  primaryName: procedure.input(z.object({ address: z.string() })).query(async ({ input }) => {
    const name = await withTimeout(resolvePrimaryName(input.address))
    return { name }
  }),
  primaryNames: procedure
    .input(z.object({ addresses: z.array(z.string()).max(20) }))
    .query(async ({ input }): Promise<Record<string, string | null>> => {
      return withTimeout(resolvePrimaryNames(input.addresses))
    }),
})
