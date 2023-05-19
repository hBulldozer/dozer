import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'

export const pricesRouter = createTRPCRouter({
  all: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany({
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
    const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
    console.log(resp)
    const data = await resp.json()
    const priceHTR = data.data.HTR
    const prices: { [key: string]: number | undefined } = {}

    tokens.forEach((token) => {
      if (token.uuid == '00') prices[token.uuid] = Number(priceHTR)
      else if (token.pools0.length > 0) {
        const poolHTR = token.pools0.find((pool: { token1: { uuid: string } }) => {
          return pool.token1.uuid == '00'
        })
        if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve1) / Number(poolHTR?.reserve0)) * priceHTR
      } else if (token.pools1.length > 0) {
        const poolHTR = token.pools1.find((pool: { token0: { uuid: string } }) => {
          return pool.token0.uuid == '00'
        })
        if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve0) / Number(poolHTR?.reserve1)) * priceHTR
      }
    })

    if (!prices) {
      throw new Error(`Failed to fetch prices, received ${prices}`)
    }
    return prices
  }),
  bySymbol: procedure.input(z.object({ symbol: z.string().max(8).min(3) })).query(({ ctx, input }) => {
    return ctx.prisma.token.findFirst({ where: { symbol: input.symbol } })
  }),
})
