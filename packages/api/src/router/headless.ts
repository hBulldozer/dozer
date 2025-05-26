import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'

// We can export common functions to use in another routers, as is suggested in https://trpc.io/docs/v10/server/server-side-calls

export const headlessRouter = createTRPCRouter({
  allNcids: procedure.input(z.object({}).optional()).query(({ ctx }) => {
    return ctx.prisma.pool.findMany({
      select: {
        id: true,
      },
    })
  }),
})
