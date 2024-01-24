import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'

export const pricesRouter = createTRPCRouter({
  all: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
        // pools0: {
        //   select: {
        //     reserve0: true,
        //     reserve1: true,
        //     token1: {
        //       select: {
        //         uuid: true,
        //       },
        //     },
        //   },
        // },
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
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
    const data = await resp.json()
    const priceHTR = data.data.HTR
    const prices: { [key: string]: number } = {}

    tokens.forEach((token) => {
      if (token.uuid == '00') prices[token.uuid] = Number(priceHTR)
      // else if (token.pools0.length > 0) {
      //   const poolHTR = token.pools0.find((pool: { token1: { uuid: string } }) => {
      //     return pool.token1.uuid == '00'
      //   })
      //   if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve1) / Number(poolHTR?.reserve0)) * priceHTR
      // }
      else if (token.pools1.length > 0) {
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
  byTokens: procedure.input(z.object({ tokens: z.any() })).query(async ({ input }) => {
    const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
    const data = await resp.json()
    const priceHTR = data.data.HTR
    const prices: { [key: string]: number } = {}
    const tokens = input.tokens

    tokens.forEach((token: any) => {
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
  fromPair: procedure.input(z.object({ pairMerged: z.any() })).query(async ({ input }) => {
    const row = input.pairMerged
    const tokenReserve: { reserve0: number; reserve1: number } = {
      reserve0: row.reserve0,
      reserve1: row.reserve1,
    }
    return row.id.includes('native') ? 1 : Number(tokenReserve.reserve0) / Number(tokenReserve.reserve1)
  }),
  htr: procedure.output(z.number()).query(async () => {
    const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
    const data = await resp.json()
    return Number(data.data.HTR)
  }),
  htrKline: procedure
    .output(z.array(z.number()))
    .input(z.object({ size: z.number(), period: z.number() }))
    .query(async ({ input }) => {
      // const now = Number(new Date())
      const now = Math.round(Date.now() / 1000)
      const period = input.period == 0 ? '5min' : input.period == 1 ? '1hour' : '1day'
      const size = (input.size + 1) * (input.period == 0 ? 15 : input.period == 1 ? 60 : 24) * 60 // in seconds
      const resp = await fetch(
        `https://api.kucoin.com/api/v1/market/candles\?type\=${period}\&symbol\=HTR-USDT\&startAt\=${
          now - size
        }\&endAt\=${now}`
      )
      const data = await resp.json()
      return data.data.map((item: any) => {
        return Number(item[2])
      })
    }),
})
