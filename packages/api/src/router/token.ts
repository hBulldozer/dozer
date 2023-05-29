import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'

export const tokenRouter = createTRPCRouter({
  all: procedure.query(({ ctx }) => {
    const tokens = ctx.prisma.token.findMany({
      select: {
        id: true,
        name: true,
        uuid: true,
        symbol: true,
        chainId: true,
        decimals: true,
        pools0: {
          select: {
            id: true,
            reserve0: true,
            reserve1: true,
            token1: {
              select: {
                uuid: true,
              },
            },
          },
        },
        pools1: {
          select: {
            id: true,
            reserve0: true,
            reserve1: true,
            token0: {
              select: {
                uuid: true,
              },
            },
          },
        },
        poolsLP: {
          select: {
            id: true,
            reserve0: true,
            reserve1: true,
            tokenLP: {
              select: {
                uuid: true,
              },
            },
          },
        },
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    return tokens
  }),
  bySymbol: procedure.input(z.object({ symbol: z.string().max(8).min(3) })).query(({ ctx, input }) => {
    return ctx.prisma.token.findFirst({ where: { symbol: input.symbol } })
  }),
})
