import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'

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
        // poolsLP: {
        //   select: {
        //     id: true,
        //     reserve0: true,
        //     reserve1: true,
        //     tokenLP: {
        //       select: {
        //         uuid: true,
        //       },
        //     },
        //   },
        // },
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    return tokens
  }),
  bySymbol: procedure.input(z.object({ symbol: z.string().max(8).min(3) })).query(({ ctx, input }) => {
    return ctx.prisma.token.findFirst({ select: { uuid: true }, where: { symbol: input.symbol } })
  }),
  totalSupply: procedure.input(z.string()).query(async ({ input }) => {
    const endpoint = 'thin_wallet/token'
    const queryParams = [`id=${input}`]
    const rawTokenData = await fetchNodeData(endpoint, queryParams)
    return rawTokenData.total
  }),
  allTotalSupply: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const endpoint = 'thin_wallet/token'
    const totalSupplies: Record<string, number> = {}
    tokens.forEach(async (token) => {
      const queryParams = [`id=${token.uuid}`]
      const rawTokenData = await fetchNodeData(endpoint, queryParams)
      totalSupplies[token.uuid] = rawTokenData.total / 100
    })
    return totalSupplies
  }),
})
